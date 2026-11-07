#!/usr/bin/env node
/**
 * CLI de integração do Claude Code com o Mattermost (via Discovery Bot).
 *
 * Uso:
 *   node integrations/mattermost/mm.mjs read <canal> [limite]
 *       -> imprime a conversa do canal em Markdown (ordem cronológica)
 *   node integrations/mattermost/mm.mjs post <canal> "<mensagem>"
 *       -> publica mensagem como Discovery Bot
 *   node integrations/mattermost/mm.mjs channels
 *       -> lista canais do time
 *
 * Token lido de .lab-state/mattermost.env (gerado pelo setup.mjs).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function loadState() {
  const envPath = path.join(ROOT, '.lab-state', 'mattermost.env');
  const content = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  }
  return env;
}

const state = loadState();
const MM_URL = state.MATTERMOST_URL ?? 'http://localhost:8065';
const TOKEN = state.MATTERMOST_BOT_TOKEN;
const TEAM = state.MATTERMOST_TEAM ?? 'medagenda';

async function api(pathname, options = {}) {
  const res = await fetch(`${MM_URL}/api/v4${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${pathname} -> ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function getChannel(name) {
  return api(`/teams/name/${TEAM}/channels/name/${name}`);
}

async function readChannel(name, limit = 500) {
  const channel = await getChannel(name);
  const data = await api(`/channels/${channel.id}/posts?per_page=${Math.min(limit, 200)}`);
  const posts = data.order
    .map((id) => data.posts[id])
    .filter((p) => !p.type) // ignora mensagens de sistema (joins etc.)
    .sort((a, b) => a.create_at - b.create_at);

  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const users = {};
  for (const id of userIds) {
    const u = await api(`/users/${id}`);
    users[id] = u.username;
  }

  console.log(`# Canal: ${name}\n`);
  for (const p of posts) {
    const when = new Date(p.create_at).toISOString();
    console.log(`**@${users[p.user_id]}** (${when}):`);
    console.log(p.message);
    console.log('');
  }
}

async function postMessage(name, message) {
  const channel = await getChannel(name);
  const post = await api('/posts', {
    method: 'POST',
    body: JSON.stringify({ channel_id: channel.id, message }),
  });
  console.log(`Postado em ${name} (post ${post.id})`);
}

async function listChannels() {
  const team = await api(`/teams/name/${TEAM}`);
  const channels = await api(`/teams/${team.id}/channels?per_page=100`);
  for (const c of channels) console.log(`${c.name}\t${c.display_name}`);
}

const [cmd, arg1, arg2] = process.argv.slice(2);
const run = {
  read: () => readChannel(arg1, arg2 ? Number(arg2) : undefined),
  post: () => postMessage(arg1, arg2),
  channels: () => listChannels(),
}[cmd];

if (!run) {
  console.error('Uso: mm.mjs read <canal> | post <canal> "<msg>" | channels');
  process.exit(1);
}
run().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
