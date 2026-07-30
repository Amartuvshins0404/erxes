#!/usr/bin/env node
//
// agent-cli.mjs — zero-dependency CLI that drives the erxes agent over its live
// /chat/stream endpoint and PARSES THE AI SDK v5 UIMessage STREAM (the protocol
// this branch ships). Talks directly to the running agent api (default
// http://localhost:3312), forging the gateway's base64 `user` header for an
// isOwner admin so no gateway/login token is needed. Reads MONGO_URL from .env
// only to (a) fetch the real admin user doc and (b) resolve/list agents — via the
// `mongosh` binary, so the script itself needs no npm install.
//
// Usage:
//   node agent-cli.mjs "show me all active product categories"
//   node agent-cli.mjs --agent "Amaraa agent" "..."
//   node agent-cli.mjs --list
//   node agent-cli.mjs                      # interactive REPL (persistent thread)
//
// Options:
//   --agent <id|name>   target agent (default: $AGENT_ID or first enabled agent)
//   --list              list agents and exit
//   --thread <id>       continue an existing thread
//   --api-url <url>     agent api base (default: $AGENT_API_URL or :3312)
//   --env <path>        .env file to read MONGO_URL from
//   --json              print raw UIMessage chunks (one per line)
//   --quiet             only the final reply + summary per turn
//   --help

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ENV_FALLBACK = '/home/darjs/dev/os/erxes/.env';

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  magenta: (s) => `\x1b[35m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
};

function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (
      a === '--list' ||
      a === '--json' ||
      a === '--quiet' ||
      a === '--help' ||
      a === '-h'
    ) {
      flags[a.replace(/^-+/, '')] = true;
    } else if (a.startsWith('--')) {
      flags[a.slice(2)] = argv[++i];
    } else {
      positional.push(a);
    }
  }
  return { flags, prompt: positional.join(' ').trim() };
}

function readEnv(path) {
  const candidates = [
    path,
    resolve(HERE, '../../../../.env'),
    resolve(HERE, '../../../../../.env'),
    REPO_ENV_FALLBACK,
  ].filter(Boolean);
  for (const p of candidates) {
    if (p && existsSync(p)) {
      const out = {};
      for (const line of readFileSync(p, 'utf-8').split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !line.trim().startsWith('#')) {
          out[m[1]] = m[2].replace(/^["']|["']$/g, '');
        }
      }
      return { vars: out, path: p };
    }
  }
  return { vars: {}, path: null };
}

function mongo(mongoUrl, evalStr) {
  const raw = execFileSync('mongosh', [mongoUrl, '--quiet', '--eval', evalStr], {
    encoding: 'utf-8',
    maxBuffer: 16 * 1024 * 1024,
  });
  return raw.trim();
}

function fetchAdminUser(mongoUrl, email) {
  const js = `print(JSON.stringify(db.users.findOne({email:${JSON.stringify(
    email,
  )}}, {password:0, resetPasswordToken:0, registrationToken:0})))`;
  const doc = JSON.parse(mongo(mongoUrl, js) || 'null');
  if (!doc?._id) throw new Error(`admin user not found: ${email}`);
  return doc;
}

function listAgents(mongoUrl) {
  const js = `db.mastra_agents.find({}, {agentId:1, name:1, model:1, provider:1, isEnabled:1, toolPolicy:1, allowedTools:1}).toArray().forEach(a => print(JSON.stringify(a)))`;
  return mongo(mongoUrl, js)
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function resolveAgent(agents, ref) {
  if (!ref) return agents.find((a) => a.isEnabled !== false) || agents[0];
  return (
    agents.find((a) => a.agentId === ref) ||
    agents.find((a) => a._id === ref) ||
    agents.find((a) => a.name?.toLowerCase() === ref.toLowerCase()) ||
    agents.find((a) => a.name?.toLowerCase().includes(ref.toLowerCase()))
  );
}

function preview(val, max = 200) {
  let s = typeof val === 'string' ? val : JSON.stringify(val);
  if (s == null) return '';
  s = s.replace(/\s+/g, ' ');
  return s.length > max ? s.slice(0, max) + '…' : s;
}

// ── AI SDK v5 UIMessage stream consumer ──────────────────────────────────────
//
// Each SSE `data:` frame is one UIMessageChunk. We fold the chunks into a turn
// the same way the backend/frontend do: text/reasoning deltas accumulate, tool
// parts go through the input→output state machine, transient data parts
// (data-activity / data-thread-title) render as status lines, and the final
// `finish` chunk carries the assistant message metadata (the native messageId
// the UI rates, plus interrupted).
async function runTurn({
  apiUrl,
  userHeader,
  hostname,
  agentId,
  message,
  threadId,
  flags,
}) {
  const res = await fetch(`${apiUrl}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', user: userHeader, hostname },
    body: JSON.stringify({ agentId, message, threadId }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
  }

  const decoder = new TextDecoder();
  let buf = '';
  const turn = {
    text: '',
    reasoning: '',
    tools: new Map(), // toolCallId → { name, input, output, error, isError }
    activities: [],
    title: null,
    threadId,
    messageId: null,
    interrupted: false,
    sawFinish: false,
    errors: [],
  };
  let lastKind = null;

  const tool = (id) => {
    if (!turn.tools.has(id)) turn.tools.set(id, { name: '', input: undefined });
    return turn.tools.get(id);
  };
  const w = (s) => !flags.quiet && process.stdout.write(s);

  const handle = (ev) => {
    if (flags.json) {
      process.stdout.write(JSON.stringify(ev) + '\n');
      return;
    }
    switch (ev.type) {
      case 'reasoning-delta':
        if (lastKind !== 'reasoning-delta') w(C.gray('\n  💭 '));
        turn.reasoning += ev.delta || '';
        w(C.gray(ev.delta || ''));
        break;

      case 'text-start':
        if (lastKind === 'reasoning-delta') w('\n\n');
        break;
      case 'text-delta':
        turn.text += ev.delta || '';
        w(ev.delta || '');
        break;

      case 'tool-input-available': {
        const t = tool(ev.toolCallId);
        t.name = ev.toolName || t.name;
        t.input = ev.input;
        w(
          C.cyan(`\n  → ${t.name}`) +
            C.dim(`(${preview(ev.input, 160)})`) +
            '\n',
        );
        break;
      }
      case 'tool-input-error': {
        const t = tool(ev.toolCallId);
        t.name = ev.toolName || t.name;
        t.isError = true;
        t.error = ev.errorText;
        turn.errors.push(preview(ev.errorText, 300));
        w(C.red(`\n  ✗ ${t.name} input error: ${preview(ev.errorText, 200)}\n`));
        break;
      }
      case 'tool-output-available': {
        const t = tool(ev.toolCallId);
        t.output = ev.output;
        w(`${C.green('  ✓')} ${C.dim(preview(ev.output, 200))}\n`);
        break;
      }
      case 'tool-output-error': {
        const t = tool(ev.toolCallId);
        t.isError = true;
        t.error = ev.errorText;
        turn.errors.push(preview(ev.errorText, 300));
        w(`${C.red('  ✗')} ${C.dim(preview(ev.errorText, 200))}\n`);
        break;
      }

      case 'data-activity':
        if (ev.data?.text) {
          turn.activities.push(ev.data.text);
          w(C.yellow(`  ⋯ ${ev.data.text}\n`));
        }
        break;
      case 'data-thread-title':
        if (ev.data?.title) {
          turn.title = ev.data.title;
          turn.threadId = ev.data.threadId || turn.threadId;
          w(C.magenta(`  🏷  title: ${ev.data.title}\n`));
        }
        break;

      case 'finish': {
        turn.sawFinish = true;
        const meta = ev.messageMetadata || {};
        if (meta.messageId) turn.messageId = meta.messageId;
        turn.interrupted = Boolean(meta.interrupted);
        break;
      }
      case 'error':
        turn.errors.push(ev.errorText || 'unknown error');
        w(C.red(`\n  ⚠ ${ev.errorText}\n`));
        break;
      // start / start-step / finish-step / text-end / reasoning-* boundaries /
      // tool-input-start|delta / data-heartbeat — no render needed.
    }
    lastKind = ev.type;
  };

  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true });
    const frames = buf.split('\n\n');
    buf = frames.pop() || '';
    for (const block of frames) {
      const line = block.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      const json = line.slice(5).trim();
      if (!json || json === '[DONE]') continue;
      try {
        handle(JSON.parse(json));
      } catch {
        /* ignore non-JSON keepalive */
      }
    }
  }

  return turn;
}

function printSummary(turn) {
  const tools = [...turn.tools.values()];
  const bits = [`${tools.length} tool${tools.length === 1 ? '' : 's'}`];
  if (tools.length) bits.push(C.dim(`[${tools.map((t) => t.name).join(', ')}]`));
  if (turn.errors.length) bits.push(C.red(`${turn.errors.length} error(s)`));
  if (turn.interrupted) bits.push(C.yellow('interrupted'));
  bits.push(C.dim(`finish:${turn.sawFinish ? '✓' : '✗'}`));
  bits.push(C.dim(`messageId:${turn.messageId || '—'}`));
  if (turn.title) bits.push(C.dim(`title:"${turn.title}"`));
  process.stdout.write(C.dim(`\n  — ${bits.join('  ')}\n`));
}

async function main() {
  const { flags, prompt } = parseArgs(process.argv.slice(2));
  if (flags.help) {
    process.stdout.write(
      readFileSync(fileURLToPath(import.meta.url), 'utf-8')
        .split('\n')
        .filter((l) => l.startsWith('//'))
        .map((l) => l.slice(3))
        .join('\n') + '\n',
    );
    return;
  }

  const { vars, path: envPath } = readEnv(flags.env);
  const mongoUrl = process.env.MONGO_URL || vars.MONGO_URL;
  const apiUrl = (
    process.env.AGENT_API_URL ||
    flags['api-url'] ||
    'http://localhost:3312'
  ).replace(/\/$/, '');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@erxes.io';
  const hostname = process.env.ERXES_HOSTNAME || 'localhost';

  if (!mongoUrl) {
    process.stderr.write(
      C.red('MONGO_URL not found (checked env + .env). Pass --env <path>.\n'),
    );
    process.exit(1);
  }
  process.stderr.write(C.dim(`env: ${envPath || 'process env'}  api: ${apiUrl}\n`));

  const agents = listAgents(mongoUrl);

  if (flags.list) {
    process.stdout.write(C.bold(`\nAgents (${agents.length}):\n`));
    for (const a of agents) {
      const enabled =
        a.isEnabled === false ? C.red('disabled') : C.green('enabled');
      process.stdout.write(
        `  ${C.cyan((a.agentId || '?').padEnd(16))}  ${C.bold(
          (a.name || '(unnamed)').padEnd(16),
        )}  ${C.dim(`${a.provider || '?'}/${a.model || '?'}`)}  ${enabled}\n`,
      );
    }
    process.stdout.write('\n');
    return;
  }

  const agent = resolveAgent(agents, process.env.AGENT_ID || flags.agent);
  if (!agent) {
    process.stderr.write(
      C.red(`No agent matched "${flags.agent}". Run --list to see options.\n`),
    );
    process.exit(1);
  }

  const adminUser = fetchAdminUser(mongoUrl, adminEmail);
  const userHeader = Buffer.from(JSON.stringify(adminUser), 'utf-8').toString(
    'base64',
  );
  process.stderr.write(
    C.dim(
      `agent: ${agent.name} (agentId:${agent.agentId}) ${agent.provider || '?'}/${
        agent.model || '?'
      }  user:${adminUser.email}${adminUser.isOwner ? ' [isOwner]' : ''}\n`,
    ),
  );

  let threadId = flags.thread || `cli-${randomUUID()}`;

  if (prompt) {
    const turn = await runTurn({
      apiUrl,
      userHeader,
      hostname,
      agentId: agent.agentId,
      message: prompt,
      threadId,
      flags,
    });
    printSummary(turn);
    return;
  }

  process.stdout.write(
    C.bold(`\nInteractive — agent "${agent.name}", thread ${threadId}\n`),
  );
  process.stdout.write(
    C.dim('Type a message, or /new (new thread), /thread (show id), /exit.\n\n'),
  );
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: C.cyan('you › '),
  });
  rl.prompt();
  rl.on('line', async (raw) => {
    const msg = raw.trim();
    if (!msg) return rl.prompt();
    if (msg === '/exit' || msg === '/quit') return rl.close();
    if (msg === '/new') {
      threadId = `cli-${randomUUID()}`;
      process.stdout.write(C.dim(`new thread ${threadId}\n`));
      return rl.prompt();
    }
    if (msg === '/thread') {
      process.stdout.write(C.dim(`thread ${threadId}\n`));
      return rl.prompt();
    }
    process.stdout.write(C.dim('agent › '));
    try {
      const turn = await runTurn({
        apiUrl,
        userHeader,
        hostname,
        agentId: agent.agentId,
        message: msg,
        threadId,
        flags,
      });
      threadId = turn.threadId || threadId;
      printSummary(turn);
    } catch (e) {
      process.stdout.write(C.red(`\nrequest failed: ${e.message}\n`));
    }
    process.stdout.write('\n');
    rl.prompt();
  });
  rl.on('close', () => {
    process.stdout.write(C.dim('\nbye\n'));
    process.exit(0);
  });
}

main().catch((e) => {
  process.stderr.write(C.red(`\nfatal: ${e.stack || e.message}\n`));
  process.exit(1);
});
