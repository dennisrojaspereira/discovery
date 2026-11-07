#!/usr/bin/env node
/**
 * Publica transcrições como conversas reais no Mattermost: cada fala é postada
 * pelo usuário fictício correspondente, preservando a ordem das falas.
 *
 * Uso:
 *   node publish-transcripts.mjs
 *       -> caso original: demo/transcripts/* nos canais negocio-/produto-/
 *          tecnologia-medagenda
 *   node publish-transcripts.mjs <dir> <slug>
 *       -> novo caso: lê <dir>/01-negocio.md, 02-produto.md, 03-tecnologia.md
 *          e publica nos canais negocio-<slug>, produto-<slug>,
 *          tecnologia-<slug> (criados automaticamente se não existirem,
 *          com todas as personas como membros)
 *
 * Idempotente: canal que já tem a conversa publicada é pulado.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MM_URL = process.env.MATTERMOST_URL ?? 'http://localhost:8065';
const TEAM = 'medagenda';
const PASSWORD = 'Personas123!';
const ADMIN_PASSWORD = process.env.MATTERMOST_ADMIN_PASSWORD ?? 'Sysadmin123!';

const [dirArg, slugArg] = process.argv.slice(2);
const DIR = dirArg ?? 'demo/transcripts';
const SLUG = slugArg ?? 'medagenda';

const FILES = [
  ['01-negocio.md', `negocio-${SLUG}`, 'Reunião de Negócio'],
  ['02-produto.md', `produto-${SLUG}`, 'Reunião de Produto'],
  ['03-tecnologia.md', `tecnologia-${SLUG}`, 'Reunião de Tecnologia'],
];

// Nome exibido na transcrição -> username no Mattermost
const SPEAKERS = {
  Mariana: 'mariana',
  Roberto: 'roberto',
  Fernanda: 'fernanda',
  Juliana: 'juliana',
  Lucas: 'lucas',
  Pedro: 'pedro',
  Rafael: 'rafael',
  Bruno: 'bruno',
  Camila: 'camila',
  'André': 'andre',
};

async function api(pathname, options = {}, token) {
  const res = await fetch(`${MM_URL}/api/v4${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${pathname} -> ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function login(username, password = PASSWORD) {
  const res = await fetch(`${MM_URL}/api/v4/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: username, password }),
  });
  if (!res.ok) throw new Error(`Login de ${username} falhou: ${res.status}`);
  return res.headers.get('token');
}

/** Garante que o canal existe e que todas as personas são membros */
async function ensureChannel(name, display, adminToken) {
  const team = await api(`/teams/name/${TEAM}`, {}, adminToken);
  let channel;
  try {
    channel = await api(`/teams/name/${TEAM}/channels/name/${name}`, {}, adminToken);
  } catch {
    channel = await api('/channels', {
      method: 'POST',
      body: JSON.stringify({
        team_id: team.id,
        name,
        display_name: display,
        type: 'O',
      }),
    }, adminToken);
    console.log(`  canal criado: ${name}`);
  }
  for (const username of [...Object.values(SPEAKERS), 'discovery-bot']) {
    try {
      const user = await api(`/users/username/${username}`, {}, adminToken);
      await api(`/channels/${channel.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: user.id }),
      }, adminToken);
    } catch {
      /* já é membro ou usuário inexistente — segue */
    }
  }
  return channel;
}

/** Extrai as falas: linhas "**[HH:MM] Nome:** texto" */
function parseTranscript(markdown) {
  const posts = [];
  for (const line of markdown.split('\n')) {
    const m = line.match(/^\*\*\[(\d{2}:\d{2})\]\s+([^:*]+):\*\*\s+(.*)$/);
    if (m) posts.push({ time: m[1], speaker: m[2].trim(), text: m[3].trim() });
  }
  return posts;
}

/** Extrai o título (primeira linha `# ...`) para o cabeçalho da conversa */
function parseTitle(markdown, fallback) {
  const m = markdown.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

async function main() {
  const adminToken = await login('sysadmin', ADMIN_PASSWORD);
  const tokens = {};
  for (const username of Object.values(SPEAKERS)) {
    tokens[username] = await login(username);
  }
  const anyToken = Object.values(tokens)[0];

  for (const [file, channelName, fallbackHeader] of FILES) {
    const filePath = path.join(ROOT, DIR, file);
    const markdown = readFileSync(filePath, 'utf8');
    const posts = parseTranscript(markdown);
    if (posts.length === 0) throw new Error(`Nenhuma fala encontrada em ${filePath}`);

    const channel = await ensureChannel(
      channelName,
      parseTitle(markdown, fallbackHeader).slice(0, 60),
      adminToken,
    );

    // Idempotência (ignora mensagens de sistema, como "entrou no canal")
    const existing = await api(`/channels/${channel.id}/posts?per_page=60`, {}, anyToken);
    const postCount = Object.values(existing.posts ?? {}).filter((p) => !p.type).length;
    if (postCount > 3) {
      console.log(`Canal ${channelName} já tem ${postCount} posts — pulando.`);
      continue;
    }

    console.log(`Publicando ${posts.length} falas em ${channelName}…`);
    const header = parseTitle(markdown, fallbackHeader);
    await api('/posts', {
      method: 'POST',
      body: JSON.stringify({
        channel_id: channel.id,
        message: `:studio_microphone: **${header}**\n_Transcrição da reunião publicada para o discovery._`,
      }),
    }, tokens[SPEAKERS[posts[0].speaker]]);

    for (const post of posts) {
      const username = SPEAKERS[post.speaker];
      if (!username) throw new Error(`Persona desconhecida: ${post.speaker}`);
      await api('/posts', {
        method: 'POST',
        body: JSON.stringify({
          channel_id: channel.id,
          message: `**[${post.time}]** ${post.text}`,
        }),
      }, tokens[username]);
      await new Promise((r) => setTimeout(r, 30)); // ordenação estável
    }
    console.log(`  ${channelName}: ok`);
  }
  console.log('\nTranscrições publicadas no Mattermost.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
