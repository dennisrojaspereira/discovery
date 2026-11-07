#!/usr/bin/env node
/**
 * Painel de controle do CTO Discovery Lab.
 *
 *   ./lab.sh panel   (ou: node scripts/panel.mjs)
 *   → http://localhost:3999
 *
 * Serve demo/panel/index.html e expõe uma API local que executa os comandos
 * do lab.sh com saída em streaming. Escuta SOMENTE em 127.0.0.1 — nunca
 * exponha este painel: ele executa comandos e a página exibe credenciais
 * (fictícias, de laboratório).
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** No Windows, "bash" do PATH pode ser o do WSL; usamos o Git Bash. */
function bashBin() {
  if (process.platform !== 'win32') return 'bash';
  if (process.env.LAB_BASH && existsSync(process.env.LAB_BASH)) {
    return process.env.LAB_BASH;
  }
  const candidates = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
    path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Git', 'bin', 'bash.exe'),
  ];
  return candidates.find((c) => existsSync(c)) ?? 'bash';
}
const BASH = bashBin();
const PAGE = path.join(ROOT, 'demo', 'panel', 'index.html');
const PORT = Number(process.env.LAB_PANEL_PORT ?? 3999);

// Comandos permitidos (whitelist — nada além disso é executável)
const COMMANDS = {
  status: ['./lab.sh status'],
  start: ['./lab.sh start'],
  stop: ['./lab.sh stop'],
  seed: ['./lab.sh seed'],
  verify: ['./lab.sh verify'],
  bootstrap: ['./lab.sh bootstrap'],
  zero: [
    './lab.sh reset --yes',
    './lab.sh bootstrap',
    './lab.sh seed',
    './lab.sh verify',
  ],
};

const SERVICES = [
  ['medagenda-web', 'http://localhost:3001/login'],
  ['medagenda-api', 'http://localhost:3002/api/health'],
  ['mattermost', 'http://localhost:8065/api/v4/system/ping'],
  ['forgejo', 'http://localhost:3000/api/healthz'],
  ['plane', 'http://localhost:8080/auth/get-csrf-token/'],
];

let running = null; // um job por vez

function runStream(name, res) {
  if (running) {
    res.writeHead(409, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Já existe um comando em execução (${running}). Aguarde terminar.\n`);
    return;
  }
  const steps = COMMANDS[name];
  running = name;
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
  });
  res.write(`$ ${steps.join(' && ')}\n\n`);

  const child = spawn(BASH, ['-c', steps.join(' && ')], {
    cwd: ROOT,
    env: { ...process.env, FORCE_COLOR: '0' },
  });
  const strip = (b) => b.toString().replace(/\x1b\[[0-9;]*m/g, '');
  child.stdout.on('data', (b) => res.write(strip(b)));
  child.stderr.on('data', (b) => res.write(strip(b)));
  child.on('close', (code) => {
    res.write(`\n[fim] exit code ${code}\n`);
    res.end();
    running = null;
  });
  res.on('close', () => {
    // cliente desconectou: deixa o comando terminar, mas libera novo via fim
  });
}

async function checkStatus() {
  const out = {};
  await Promise.all(
    SERVICES.map(async ([name, url]) => {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2500);
        const res = await fetch(url, { signal: ctrl.signal });
        clearTimeout(t);
        out[name] = res.ok;
      } catch {
        out[name] = false;
      }
    }),
  );
  out._running = running;
  return out;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/' || url.pathname === '/index.html') {
    try {
      const html = readFileSync(PAGE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch {
      res.writeHead(500);
      res.end('demo/panel/index.html não encontrado');
    }
    return;
  }

  if (url.pathname === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(await checkStatus()));
    return;
  }

  if (url.pathname === '/api/run' && req.method === 'POST') {
    const cmd = url.searchParams.get('cmd');
    if (!COMMANDS[cmd]) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Comando desconhecido\n');
      return;
    }
    runStream(cmd, res);
    return;
  }

  res.writeHead(404);
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Painel do laboratório: http://localhost:${PORT}`);
  console.log('(escutando apenas em 127.0.0.1 — não exponha este painel)');
});
