#!/usr/bin/env node
/**
 * Publica as três transcrições de demo/transcripts como conversas reais
 * no Mattermost: cada fala é postada pelo usuário fictício correspondente,
 * preservando a ordem das falas.
 *
 * Idempotente: se o canal já tem posts das personas, pula a republicação.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MM_URL = process.env.MATTERMOST_URL ?? 'http://localhost:8065';
const TEAM = 'medagenda';
const PASSWORD = 'Personas123!';

const FILES = [
  ['01-negocio.md', 'negocio-medagenda', 'Reunião de Negócio — cancelamentos e horários ociosos (2026-10-27)'],
  ['02-produto.md', 'produto-medagenda', 'Reunião de Produto — ocupação das agendas (2026-10-30)'],
  ['03-tecnologia.md', 'tecnologia-medagenda', 'Reunião de Tecnologia — viabilidade técnica (2026-11-03)'],
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

async function login(username) {
  const res = await fetch(`${MM_URL}/api/v4/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: username, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login de ${username} falhou: ${res.status}`);
  return res.headers.get('token');
}

/** Extrai as falas: linhas "**[HH:MM] Nome:** texto" */
function parseTranscript(markdown) {
  const lines = markdown.split('\n');
  const posts = [];
  for (const line of lines) {
    const m = line.match(/^\*\*\[(\d{2}:\d{2})\]\s+([^:*]+):\*\*\s+(.*)$/);
    if (m) {
      const [, time, speaker, text] = m;
      posts.push({ time, speaker: speaker.trim(), text: text.trim() });
    }
  }
  return posts;
}

async function main() {
  // tokens por persona (login via API)
  const tokens = {};
  for (const username of Object.values(SPEAKERS)) {
    tokens[username] = await login(username);
  }
  const anyToken = Object.values(tokens)[0];

  for (const [file, channelName, header] of FILES) {
    const channel = await api(`/teams/name/${TEAM}/channels/name/${channelName}`, {}, anyToken);

    // Idempotência: pula canal que já tem a conversa publicada
    // (ignora mensagens de sistema, como "entrou no canal")
    const existing = await api(`/channels/${channel.id}/posts?per_page=60`, {}, anyToken);
    const postCount = Object.values(existing.posts ?? {}).filter((p) => !p.type).length;
    if (postCount > 3) {
      console.log(`Canal ${channelName} já tem ${postCount}+ posts — pulando.`);
      continue;
    }

    const markdown = readFileSync(path.join(ROOT, 'demo', 'transcripts', file), 'utf8');
    const posts = parseTranscript(markdown);
    if (posts.length === 0) throw new Error(`Nenhuma fala encontrada em ${file}`);

    console.log(`Publicando ${posts.length} falas em ${channelName}…`);
    // Cabeçalho da reunião postado pela primeira persona da conversa
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
      // pequena pausa para garantir ordenação estável por create_at
      await new Promise((r) => setTimeout(r, 30));
    }
    console.log(`  ${channelName}: ok`);
  }
  console.log('\nTranscrições publicadas no Mattermost.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
