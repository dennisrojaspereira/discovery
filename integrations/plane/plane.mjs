#!/usr/bin/env node
/**
 * CLI de integração do Claude Code com o Plane (workspace "medagenda").
 *
 * Comandos:
 *   ensure-project                cria (ou recupera) o projeto MedAgenda
 *   publish-docs                  publica as páginas de documentação do discovery
 *   publish-backlog               cria épico + histórias com labels de fase
 *   get-story <HIST-xxx>          imprime uma história (nome, estado, descrição)
 *   list-stories                  lista issues do projeto
 *   verify                        confere projeto, páginas e issues criadas
 *
 * Autenticação:
 *  - API pública v1 (X-API-Key) para projetos/labels/issues.
 *  - API interna de sessão (cookies) para Pages, que não existem na v1.
 * Credenciais em .lab-state/plane.env (geradas pelo bootstrap).
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function loadState() {
  const content = readFileSync(path.join(ROOT, '.lab-state', 'plane.env'), 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  }
  return env;
}

const state = loadState();
const BASE = state.PLANE_URL ?? 'http://localhost:8080';
const API_KEY = state.PLANE_API_KEY;
const SLUG = state.PLANE_WORKSPACE_SLUG ?? 'medagenda';
const EMAIL = state.PLANE_LOGIN_EMAIL ?? 'discovery@medagenda.local';
const PASSWORD = state.PLANE_LOGIN_PASSWORD ?? 'DiscoveryLab2026!';

const PROJECT = { name: 'MedAgenda', identifier: 'MEDA' };

// ---------- API pública v1 (X-API-Key) ----------

async function v1(pathname, options = {}) {
  const res = await fetch(`${BASE}/api/v1${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`v1 ${options.method ?? 'GET'} ${pathname} -> ${res.status}: ${JSON.stringify(body).slice(0, 400)}`);
  }
  return body;
}

// ---------- API interna (sessão com cookies) ----------

class Session {
  constructor() {
    this.cookies = new Map();
  }
  absorb(res) {
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(';');
      const [name, ...val] = pair.split('=');
      this.cookies.set(name.trim(), val.join('='));
    }
  }
  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
  get csrf() {
    return this.cookies.get('csrftoken');
  }
  async login() {
    const t = await fetch(`${BASE}/auth/get-csrf-token/`);
    this.absorb(t);
    const form = new URLSearchParams({
      email: EMAIL,
      password: PASSWORD,
      csrfmiddlewaretoken: this.csrf,
    });
    const res = await fetch(`${BASE}/auth/sign-in/`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: this.header(),
        Referer: BASE,
      },
      body: form,
    });
    this.absorb(res);
    const loc = res.headers.get('location') ?? '';
    if (loc.includes('error_code')) throw new Error(`Login no Plane falhou: ${loc}`);
  }
  async api(pathname, options = {}) {
    const res = await fetch(`${BASE}/api${pathname}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Cookie: this.header(),
        'X-CSRFToken': this.csrf,
        Referer: BASE,
        ...options.headers,
      },
    });
    this.absorb(res);
    const text = await res.text();
    const body = text ? JSON.parse(text) : {};
    if (!res.ok) {
      throw new Error(`session ${options.method ?? 'GET'} ${pathname} -> ${res.status}: ${text.slice(0, 400)}`);
    }
    return body;
  }
}

// ---------- Helpers ----------

function md(filePath) {
  return readFileSync(path.join(ROOT, filePath), 'utf8');
}

function mdToHtml(markdown) {
  // remove frontmatter YAML antes de converter
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
  return marked.parse(body, { gfm: true });
}

async function ensureProject() {
  const list = await v1(`/workspaces/${SLUG}/projects/`);
  const existing = (list.results ?? []).find((p) => p.identifier === PROJECT.identifier);
  if (existing) {
    console.log(`Projeto já existe: ${existing.name} (${existing.id})`);
    return existing;
  }
  const project = await v1(`/workspaces/${SLUG}/projects/`, {
    method: 'POST',
    body: JSON.stringify({
      name: PROJECT.name,
      identifier: PROJECT.identifier,
      description:
        'Gestão de clínicas médicas — produto do CTO Discovery Lab. Épico ativo: otimização da agenda (lista de espera).',
    }),
  });
  console.log(`Projeto criado: ${project.name} (${project.id})`);
  return project;
}

async function ensureLabels(projectId, names) {
  const list = await v1(`/workspaces/${SLUG}/projects/${projectId}/labels/`);
  const existing = new Map((list.results ?? []).map((l) => [l.name, l]));
  const colors = { 'fase-1': '#1569b3', 'fase-2': '#3fa98e', 'fase-3': '#b07818', 'épico': '#7c3aed', 'hipótese': '#c23b3b' };
  const out = {};
  for (const name of names) {
    if (existing.has(name)) {
      out[name] = existing.get(name);
    } else {
      out[name] = await v1(`/workspaces/${SLUG}/projects/${projectId}/labels/`, {
        method: 'POST',
        body: JSON.stringify({ name, color: colors[name] ?? '#5b7187' }),
      });
      console.log(`  label criada: ${name}`);
    }
  }
  return out;
}

const DOCS = [
  ['Visão do produto — MedAgenda', 'README.md'],
  ['Transcrição — Reunião de Negócio', 'demo/transcripts/01-negocio.md'],
  ['Transcrição — Reunião de Produto', 'demo/transcripts/02-produto.md'],
  ['Transcrição — Reunião de Tecnologia', 'demo/transcripts/03-tecnologia.md'],
  ['Síntese do discovery (evidências)', 'output/discovery/sintese-conversas.md'],
  ['Product Brief — Otimização da agenda', 'output/product-brief/product-brief.md'],
  ['PRD — Lista de espera', 'output/prd/prd.md'],
  ['Arquitetura AS-IS', 'output/architecture/as-is.md'],
  ['Arquitetura TO-BE', 'output/architecture/to-be.md'],
  ['ADR-001 — Confirmação sem trava de vaga', 'output/architecture/adr/ADR-001-confirmacao-sem-trava-de-vaga.md'],
  ['ADR-002 — Outbox em vez de mensageria', 'output/architecture/adr/ADR-002-outbox-em-vez-de-mensageria.md'],
  ['ADR-003 — Regras determinísticas, sem LLM', 'output/architecture/adr/ADR-003-regras-deterministicas-sem-llm.md'],
  ['ADR-004 — Expiração lazy na fase 1', 'output/architecture/adr/ADR-004-expiracao-lazy-na-fase-1.md'],
  ['Matriz de rastreabilidade', 'output/backlog/matriz-rastreabilidade.md'],
];

async function publishDocs() {
  const project = await ensureProject();
  const session = new Session();
  await session.login();

  const existing = await session.api(`/workspaces/${SLUG}/projects/${project.id}/pages/`);
  const existingNames = new Set((Array.isArray(existing) ? existing : existing.results ?? []).map((p) => p.name));

  for (const [title, file] of DOCS) {
    if (!existsSync(path.join(ROOT, file))) {
      console.log(`  (pulado, arquivo ausente: ${file})`);
      continue;
    }
    if (existingNames.has(title)) {
      console.log(`  página já existe: ${title}`);
      continue;
    }
    const html = mdToHtml(md(file));
    const page = await session.api(`/workspaces/${SLUG}/projects/${project.id}/pages/`, {
      method: 'POST',
      body: JSON.stringify({ name: title, description_html: html, access: 0 }),
    });
    console.log(`  página criada: ${title} (${page.id})`);
  }
  console.log(`\nDocs publicados em ${BASE}/${SLUG}/projects/${project.id}/pages`);
}

const STORIES = [
  { id: 'HIST-101', file: 'output/backlog/stories/HIST-101-registrar-interesse.md', title: 'HIST-101 · Registrar interesse na lista de espera (API)', labels: ['fase-1'], priority: 'high' },
  { id: 'HIST-102', file: 'output/backlog/stories/HIST-102-consultar-fila.md', title: 'HIST-102 · Consultar a fila com filtros e expiração', labels: ['fase-1'], priority: 'high' },
  { id: 'HIST-103', file: 'output/backlog/stories/HIST-103-baixa-interesse.md', title: 'HIST-103 · Dar baixa em interesse (atendido/desistiu)', labels: ['fase-1'], priority: 'medium' },
  { id: 'HIST-104', file: 'output/backlog/stories/HIST-104-fila-no-agendamento.md', title: 'HIST-104 · Fila visível no fluxo de agendamento (Web)', labels: ['fase-1'], priority: 'medium' },
  { id: 'HIST-201', text: 'Outbox transacional no cancelamento (SLOT_RELEASED). Requisito RF-104, ADR-002. Aguarda piloto da fase 1.', title: 'HIST-201 · Outbox transacional no cancelamento', labels: ['fase-2', 'hipótese'], priority: 'low' },
  { id: 'HIST-202', text: 'Matching determinístico de interessados compatíveis com slot liberado. RF-101, ADR-003.', title: 'HIST-202 · Matching de interessados com slot liberado', labels: ['fase-2', 'hipótese'], priority: 'low' },
  { id: 'HIST-203', text: 'Oferta com expiração (SLA parametrizável, Q5 aberto). RF-102.', title: 'HIST-203 · Oferta com expiração (SLA)', labels: ['fase-2', 'hipótese'], priority: 'low' },
  { id: 'HIST-204', text: 'Confirmação segura reutilizando transação + exclusion constraint do agendamento. RF-103, ADR-001.', title: 'HIST-204 · Confirmação segura da oferta', labels: ['fase-2', 'hipótese'], priority: 'low' },
  { id: 'HIST-301', text: 'Notificação ao paciente com consentimento de canal (Q4 aberto). RF-201.', title: 'HIST-301 · Notificação com consentimento', labels: ['fase-3', 'hipótese'], priority: 'none' },
  { id: 'HIST-302', text: 'Métricas de reocupação no dashboard (taxa, tempo, resposta a ofertas). RF-202.', title: 'HIST-302 · Métricas de reocupação', labels: ['fase-3', 'hipótese'], priority: 'none' },
];

async function publishBacklog() {
  const project = await ensureProject();
  const labels = await ensureLabels(project.id, ['épico', 'fase-1', 'fase-2', 'fase-3', 'hipótese']);

  const issuesPath = `/workspaces/${SLUG}/projects/${project.id}/issues/`;
  const list = await v1(`${issuesPath}?per_page=100`);
  const existing = new Map((list.results ?? []).map((i) => [i.name, i]));

  // Épico (issue-pai com label 'épico')
  const epicTitle = 'Épico · Otimização da agenda médica (lista de espera)';
  let epic = existing.get(epicTitle);
  if (!epic) {
    epic = await v1(issuesPath, {
      method: 'POST',
      body: JSON.stringify({
        name: epicTitle,
        description_html: mdToHtml(md('output/backlog/backlog.md')),
        labels: [labels['épico'].id],
        priority: 'urgent',
      }),
    });
    console.log(`Épico criado: ${epic.id}`);
  } else {
    console.log('Épico já existia.');
  }

  for (const story of STORIES) {
    if (existing.has(story.title)) {
      console.log(`  história já existe: ${story.id}`);
      continue;
    }
    const html = story.file
      ? mdToHtml(md(story.file))
      : marked.parse(story.text);
    const issue = await v1(issuesPath, {
      method: 'POST',
      body: JSON.stringify({
        name: story.title,
        description_html: html,
        labels: story.labels.map((l) => labels[l].id),
        parent: epic.id,
        priority: story.priority,
      }),
    });
    console.log(`  história criada: ${story.id} (${issue.id})`);
  }
  console.log(`\nBacklog publicado em ${BASE}/${SLUG}/projects/${project.id}/issues`);
}

async function getStory(histId) {
  const project = await ensureProject();
  const list = await v1(`/workspaces/${SLUG}/projects/${project.id}/issues/?per_page=100`);
  const issue = (list.results ?? []).find((i) => i.name.startsWith(histId));
  if (!issue) throw new Error(`História ${histId} não encontrada no Plane`);
  const full = await v1(`/workspaces/${SLUG}/projects/${project.id}/issues/${issue.id}/`);
  console.log(`# ${full.name}`);
  console.log(`id: ${full.id}`);
  console.log(`estado: ${full.state ?? ''} | prioridade: ${full.priority}`);
  console.log(`url: ${BASE}/${SLUG}/projects/${project.id}/issues/${full.id}`);
  console.log('\n--- descrição (HTML) ---');
  console.log(full.description_html ?? '(vazia)');
}

async function listStories() {
  const project = await ensureProject();
  const list = await v1(`/workspaces/${SLUG}/projects/${project.id}/issues/?per_page=100`);
  for (const i of list.results ?? []) {
    console.log(`${i.name}`);
  }
}

async function verify() {
  const project = await ensureProject();
  const issues = await v1(`/workspaces/${SLUG}/projects/${project.id}/issues/?per_page=100`);
  const session = new Session();
  await session.login();
  const pages = await session.api(`/workspaces/${SLUG}/projects/${project.id}/pages/`);
  const pageList = Array.isArray(pages) ? pages : pages.results ?? [];
  console.log(`Projeto: ${project.name} (${project.identifier}) — ${BASE}/${SLUG}/projects/${project.id}/issues`);
  console.log(`Issues: ${issues.total_count ?? (issues.results ?? []).length}`);
  console.log(`Páginas: ${pageList.length}`);
  for (const p of pageList) console.log(`  - ${p.name}`);
}

const [cmd, arg1] = process.argv.slice(2);
const run = {
  'ensure-project': ensureProject,
  'publish-docs': publishDocs,
  'publish-backlog': publishBacklog,
  'get-story': () => getStory(arg1),
  'list-stories': listStories,
  verify,
}[cmd];

if (!run) {
  console.error('Uso: plane.mjs ensure-project | publish-docs | publish-backlog | get-story <HIST-xxx> | list-stories | verify');
  process.exit(1);
}
run().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
