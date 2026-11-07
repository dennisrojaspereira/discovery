#!/usr/bin/env node
/**
 * CLI de integração do Claude Code com o Forgejo.
 *
 * Uso:
 *   node integrations/forgejo/forgejo.mjs push <branch>
 *       -> publica a branch local no Forgejo (sem gravar token no .git)
 *   node integrations/forgejo/forgejo.mjs pr <branch> "<título>" "<corpo>"
 *       -> abre Pull Request de <branch> para main (NUNCA faz merge)
 *   node integrations/forgejo/forgejo.mjs prs
 *       -> lista PRs abertos
 *
 * Token lido de .lab-state/forgejo.env (gerado pelo setup.mjs).
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function loadState() {
  const content = readFileSync(path.join(ROOT, '.lab-state', 'forgejo.env'), 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  }
  return env;
}

const { FORGEJO_URL, FORGEJO_TOKEN, FORGEJO_OWNER, FORGEJO_REPO } = loadState();

async function api(pathname, options = {}) {
  const res = await fetch(`${FORGEJO_URL}/api/v1${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `token ${FORGEJO_TOKEN}`,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${options.method ?? 'GET'} ${pathname} -> ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

function push(branch) {
  const pushUrl = `${FORGEJO_URL.replace('://', `://${FORGEJO_OWNER}:${FORGEJO_TOKEN}@`)}/${FORGEJO_OWNER}/${FORGEJO_REPO}.git`;
  execFileSync('git', ['push', pushUrl, `${branch}:${branch}`], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  console.log(`Branch ${branch} publicada no Forgejo.`);
}

async function openPr(branch, title, body) {
  const pr = await api(`/repos/${FORGEJO_OWNER}/${FORGEJO_REPO}/pulls`, {
    method: 'POST',
    body: JSON.stringify({ head: branch, base: 'main', title, body }),
  });
  console.log(`PR #${pr.number} aberto: ${FORGEJO_URL}/${FORGEJO_OWNER}/${FORGEJO_REPO}/pulls/${pr.number}`);
  return pr;
}

async function listPrs() {
  const prs = await api(`/repos/${FORGEJO_OWNER}/${FORGEJO_REPO}/pulls?state=open`);
  for (const pr of prs) {
    console.log(`#${pr.number}\t${pr.head.ref} -> ${pr.base.ref}\t${pr.title}`);
  }
  if (prs.length === 0) console.log('(nenhum PR aberto)');
}

const [cmd, arg1, arg2, arg3] = process.argv.slice(2);
const run = {
  push: () => Promise.resolve(push(arg1)),
  pr: () => openPr(arg1, arg2, arg3 ?? ''),
  prs: () => listPrs(),
}[cmd];

if (!run) {
  console.error('Uso: forgejo.mjs push <branch> | pr <branch> "<título>" "<corpo>" | prs');
  process.exit(1);
}
run().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
