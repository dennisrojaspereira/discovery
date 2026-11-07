#!/usr/bin/env node
/**
 * Provisiona o Mattermost do laboratório:
 *  - usuários (sysadmin + personas fictícias das reuniões)
 *  - time "medagenda" e canais do discovery
 *  - bot "discovery-bot" com token (salvo em .lab-state/mattermost.env)
 *
 * Usa `mmctl --local` dentro do container (não precisa de senha/token).
 * Idempotente: reexecutar não quebra (ignora "already exists").
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MM_URL = process.env.MATTERMOST_URL ?? 'http://localhost:8065';
const CONTAINER = 'lab-mattermost';

const TEAM = 'medagenda';
const CHANNELS = [
  ['negocio-medagenda', 'Negócio · MedAgenda'],
  ['produto-medagenda', 'Produto · MedAgenda'],
  ['tecnologia-medagenda', 'Tecnologia · MedAgenda'],
  ['discovery-medagenda', 'Discovery · MedAgenda'],
  ['engenharia-medagenda', 'Engenharia · MedAgenda'],
  ['entregas-medagenda', 'Entregas · MedAgenda'],
];

// Personas das três reuniões (dados fictícios)
export const PERSONAS = [
  ['mariana', 'Mariana', 'CEO'],
  ['roberto', 'Roberto', 'Diretor de Operações'],
  ['fernanda', 'Fernanda', 'Atendimento'],
  ['juliana', 'Juliana', 'Product Manager'],
  ['lucas', 'Lucas', 'UX Designer'],
  ['pedro', 'Pedro', 'Analista de Produto'],
  ['rafael', 'Rafael', 'CTO'],
  ['bruno', 'Bruno', 'Software Architect'],
  ['camila', 'Camila', 'Tech Lead'],
  ['andre', 'André', 'Backend Engineer'],
];
export const PERSONA_PASSWORD = 'Personas123!';

function mmctl(...args) {
  try {
    const out = execFileSync(
      'docker',
      ['exec', CONTAINER, 'mmctl', '--local', ...args],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return { ok: true, out };
  } catch (err) {
    const msg = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    if (/already exists|already a member|duplicate|unique constraint/i.test(msg)) {
      return { ok: true, out: msg, existed: true };
    }
    return { ok: false, out: msg };
  }
}

async function waitForServer() {
  process.stdout.write(`Aguardando Mattermost em ${MM_URL} `);
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(`${MM_URL}/api/v4/system/ping`);
      if (res.ok) {
        console.log('— pronto.');
        return;
      }
    } catch {
      /* ainda subindo */
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Mattermost não respondeu a tempo');
}

function ensureUser(username, nickname, position, opts = {}) {
  const args = [
    'user', 'create',
    '--email', `${username}@medagenda.local`,
    '--username', username,
    '--password', opts.password ?? PERSONA_PASSWORD,
    '--firstname', nickname,
    '--email-verified',
  ];
  if (opts.admin) args.push('--system-admin');
  const r = mmctl(...args);
  if (!r.ok) throw new Error(`Falha criando usuário ${username}: ${r.out}`);
  console.log(`  usuário ${username} ${r.existed ? '(já existia)' : 'criado'}`);
}

async function main() {
  await waitForServer();

  console.log('Criando sysadmin…');
  ensureUser('sysadmin', 'Sysadmin', 'Admin', {
    admin: true,
    password: process.env.MATTERMOST_ADMIN_PASSWORD ?? 'Sysadmin123!',
  });

  console.log('Criando personas…');
  for (const [username, nickname, position] of PERSONAS) {
    ensureUser(username, nickname, position);
  }

  console.log(`Criando time ${TEAM}…`);
  let r = mmctl('team', 'create', '--name', TEAM, '--display-name', 'MedAgenda', '--private=false');
  if (!r.ok) throw new Error(`Falha criando time: ${r.out}`);

  console.log('Adicionando usuários ao time…');
  const allUsers = ['sysadmin', ...PERSONAS.map(([u]) => u)];
  r = mmctl('team', 'users', 'add', TEAM, ...allUsers);
  if (!r.ok) throw new Error(`Falha adicionando usuários: ${r.out}`);

  console.log('Criando canais…');
  for (const [name, display] of CHANNELS) {
    r = mmctl('channel', 'create', '--team', TEAM, '--name', name, '--display-name', display);
    if (!r.ok) throw new Error(`Falha criando canal ${name}: ${r.out}`);
    r = mmctl('channel', 'users', 'add', `${TEAM}:${name}`, ...allUsers);
    if (!r.ok) throw new Error(`Falha populando canal ${name}: ${r.out}`);
    console.log(`  canal ${name} ok`);
  }

  console.log('Criando Discovery Bot (via API, como sysadmin)…');
  const adminPassword = process.env.MATTERMOST_ADMIN_PASSWORD ?? 'Sysadmin123!';
  const loginRes = await fetch(`${MM_URL}/api/v4/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login_id: 'sysadmin', password: adminPassword }),
  });
  if (!loginRes.ok) throw new Error(`Login do sysadmin falhou: ${loginRes.status}`);
  const adminToken = loginRes.headers.get('token');
  const api = async (pathname, options = {}) => {
    const res = await fetch(`${MM_URL}/api/v4${pathname}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  };

  // Cria o bot (ou recupera se já existe)
  let botUserId;
  const createBot = await api('/bots', {
    method: 'POST',
    body: JSON.stringify({
      username: 'discovery-bot',
      display_name: 'Discovery Bot',
      description: 'Bot do laboratório de discovery (notificações da esteira)',
    }),
  });
  if (createBot.status === 201) {
    botUserId = createBot.body.user_id;
    console.log('  bot criado');
  } else {
    const existing = await api('/users/username/discovery-bot');
    if (existing.status !== 200) {
      throw new Error(`Falha criando bot: ${JSON.stringify(createBot.body)}`);
    }
    botUserId = existing.body.id;
    console.log('  bot já existia');
  }

  // Bot entra no time e nos canais para poder postar
  const teamInfo = await api(`/teams/name/${TEAM}`);
  await api(`/teams/${teamInfo.body.id}/members`, {
    method: 'POST',
    body: JSON.stringify({ team_id: teamInfo.body.id, user_id: botUserId }),
  });
  for (const [name] of CHANNELS) {
    const ch = await api(`/teams/name/${TEAM}/channels/name/${name}`);
    await api(`/channels/${ch.body.id}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: botUserId }),
    });
  }

  console.log('Gerando token do bot…');
  const tokenRes = await api(`/users/${botUserId}/tokens`, {
    method: 'POST',
    body: JSON.stringify({ description: 'discovery-lab' }),
  });
  if (tokenRes.status !== 200 && tokenRes.status !== 201) {
    throw new Error(`Falha gerando token: ${JSON.stringify(tokenRes.body)}`);
  }
  const token = tokenRes.body.token;

  const stateDir = path.join(ROOT, '.lab-state');
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(
    path.join(stateDir, 'mattermost.env'),
    `MATTERMOST_URL=${MM_URL}\nMATTERMOST_BOT_TOKEN=${token}\nMATTERMOST_TEAM=${TEAM}\n`,
  );
  console.log(`\nMattermost provisionado. Token do bot salvo em .lab-state/mattermost.env`);
  console.log(`Login admin: sysadmin@medagenda.local / ${process.env.MATTERMOST_ADMIN_PASSWORD ?? 'Sysadmin123!'}`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
