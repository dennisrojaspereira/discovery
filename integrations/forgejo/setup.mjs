#!/usr/bin/env node
/**
 * Provisiona o Forgejo do laboratório:
 *  - usuário admin (labadmin)
 *  - access token (salvo em .lab-state/forgejo.env)
 *  - repositório único `cto-discovery-lab`
 *  - push da branch main do monorepo
 *
 * Idempotente: reexecutar não quebra.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FORGEJO_URL = process.env.FORGEJO_URL ?? 'http://localhost:3000';
const CONTAINER = 'lab-forgejo';
const ADMIN_USER = process.env.FORGEJO_ADMIN_USER ?? 'labadmin';
const ADMIN_PASSWORD = process.env.FORGEJO_ADMIN_PASSWORD ?? 'Labadmin123!';
const ADMIN_EMAIL = process.env.FORGEJO_ADMIN_EMAIL ?? 'labadmin@local.test';
const REPO = process.env.FORGEJO_REPO ?? 'cto-discovery-lab';

function forgejoCli(...args) {
  try {
    const out = execFileSync(
      'docker',
      ['exec', '-u', '1000', CONTAINER, 'forgejo', ...args],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    return { ok: true, out };
  } catch (err) {
    const msg = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    if (/already exists|already been used/i.test(msg)) {
      return { ok: true, out: msg, existed: true };
    }
    return { ok: false, out: msg };
  }
}

async function waitForServer() {
  process.stdout.write(`Aguardando Forgejo em ${FORGEJO_URL} `);
  for (let i = 0; i < 90; i++) {
    try {
      const res = await fetch(`${FORGEJO_URL}/api/healthz`);
      if (res.ok) {
        console.log('— pronto.');
        return;
      }
    } catch {
      /* subindo */
    }
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('Forgejo não respondeu a tempo');
}

async function main() {
  await waitForServer();

  console.log(`Criando usuário admin ${ADMIN_USER}…`);
  let r = forgejoCli(
    'admin', 'user', 'create',
    '--admin',
    '--username', ADMIN_USER,
    '--password', ADMIN_PASSWORD,
    '--email', ADMIN_EMAIL,
    '--must-change-password=false',
  );
  if (!r.ok) throw new Error(`Falha criando admin: ${r.out}`);
  console.log(`  ${r.existed ? 'já existia' : 'criado'}`);

  console.log('Gerando access token…');
  r = forgejoCli(
    'admin', 'user', 'generate-access-token',
    '--username', ADMIN_USER,
    '--token-name', `lab-${Date.now()}`,
    '--scopes', 'all',
  );
  if (!r.ok) throw new Error(`Falha gerando token: ${r.out}`);
  const tokenMatch = r.out.match(/[0-9a-f]{40}/);
  if (!tokenMatch) throw new Error(`Token não encontrado: ${r.out}`);
  const token = tokenMatch[0];

  const api = async (pathname, options = {}) => {
    const res = await fetch(`${FORGEJO_URL}/api/v1${pathname}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `token ${token}`,
      },
    });
    return { status: res.status, body: await res.json().catch(() => ({})) };
  };

  console.log(`Criando repositório ${REPO}…`);
  const create = await api('/user/repos', {
    method: 'POST',
    body: JSON.stringify({
      name: REPO,
      description: 'CTO Discovery Lab — monorepo MedAgenda (laboratório de engenharia agêntica)',
      private: false,
      default_branch: 'main',
      auto_init: false,
    }),
  });
  if (create.status === 201) console.log('  repositório criado');
  else if (create.status === 409) console.log('  repositório já existia');
  else throw new Error(`Falha criando repo: ${create.status} ${JSON.stringify(create.body)}`);

  const stateDir = path.join(ROOT, '.lab-state');
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(
    path.join(stateDir, 'forgejo.env'),
    [
      `FORGEJO_URL=${FORGEJO_URL}`,
      `FORGEJO_TOKEN=${token}`,
      `FORGEJO_OWNER=${ADMIN_USER}`,
      `FORGEJO_REPO=${REPO}`,
      '',
    ].join('\n'),
  );

  console.log('Enviando branch main para o Forgejo…');
  const pushUrl = `${FORGEJO_URL.replace('://', `://${ADMIN_USER}:${token}@`)}/${ADMIN_USER}/${REPO}.git`;
  execFileSync('git', ['push', pushUrl, 'main:main'], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  console.log(`\nForgejo provisionado: ${FORGEJO_URL}/${ADMIN_USER}/${REPO}`);
  console.log(`Login: ${ADMIN_USER} / ${ADMIN_PASSWORD} — token salvo em .lab-state/forgejo.env`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
