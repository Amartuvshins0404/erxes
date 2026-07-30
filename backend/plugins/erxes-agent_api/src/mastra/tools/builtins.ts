import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { ExpectedError } from 'erxes-api-shared/utils';
import { safeFetch } from '~/mastra/safeFetch';
import {
  decodeHtmlEntities as decodeEntities,
  stripAllTags,
  stripScriptAndStyleBlocks,
} from '~/mastra/html';
import { companyKnowledgeTool } from '~/mastra/knowledge/knowledgeTool';
import { agentKnowledgeTool } from '~/mastra/learning/learningTool';
import { fileReaderTool } from './fileReaderTool';
import { WORKFLOW_BUILTIN_TOOLS } from './workflowTools';
import { chartSpecSchema, sanitizeChartSpec } from '~/mastra/charts/chartSpec';
import { chartArtifactSchema, newArtifactId } from './artifacts';
import { storeArtifact } from '~/mastra/artifactStore';
import { DOCUMENT_BUILTIN_TOOLS } from './documentTools';

const FETCH_TIMEOUT_MS = 10_000;
const UA = 'Mozilla/5.0 (compatible; erxes-agent/1.0)';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/** Strip HTML tags, decode entities, and collapse whitespace. */
function stripTags(html: string): string {
  return decodeEntities(stripAllTags(html)).replace(/\s+/g, ' ').trim();
}

// DuckDuckGo's HTML endpoint — no API key needed. Result hrefs are DDG
// redirect URLs — the real target lives in the `uddg` query param. Ad slots
// point at duckduckgo.com/y.js and are skipped.
async function ddgSearch(
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const res = await fetch(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error(`DuckDuckGo search failed: ${res.status}`);
  const html = await res.text();

  const results: SearchResult[] = [];
  const blockRe =
    /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(html)) && results.length < limit) {
    const href = decodeEntities(match[1]);
    const uddg = href.match(/[?&]uddg=([^&]+)/);
    const target = uddg ? decodeURIComponent(uddg[1]) : href;
    if (target.includes('duckduckgo.com/y.js')) continue;
    results.push({
      title: stripTags(match[2]),
      url: target,
      snippet: stripTags(match[3]),
    });
  }
  return results;
}

export const webSearchTool = createTool({
  id: 'web-search',
  description:
    'Search the web for any topic. Returns top results with titles, URLs and snippets. Use fetch-url to read a result in full.',
  inputSchema: z.object({
    query: z.string().describe('The search query'),
    limit: z.number().int().min(1).max(10).default(5).describe('Max results'),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
      }),
    ),
  }),
  execute: async ({ query, limit }) => {
    return { results: await ddgSearch(query, limit ?? 5) };
  },
});

const MAX_CONTENT_CHARS = 8_000;

export const fetchUrlTool = createTool({
  id: 'fetch-url',
  description:
    'Fetch a public web page and return its readable text content. Use after web-search to read a result in full.',
  inputSchema: z.object({
    url: z
      .string()
      .describe('Absolute http(s) URL, e.g. from web-search results'),
  }),
  outputSchema: z.object({
    url: z.string(),
    title: z.string(),
    content: z.string(),
  }),
  execute: async ({ url }) => {
    const { res, finalUrl } = await safeFetch(url);
    if (!res.ok)
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);

    const body = (await res.text()).slice(0, 500_000);
    const title = stripTags(
      body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '',
    );
    const content = stripTags(
      stripScriptAndStyleBlocks(body).replace(
        /<(nav|header|footer|noscript)\b[\s\S]*?<\/\1\b[^>]*>/gi,
        ' ',
      ),
    ).slice(0, MAX_CONTENT_CHARS);

    return {
      url: finalUrl,
      title,
      content: content || 'No readable content found.',
    };
  },
});

export const calculatorTool = createTool({
  id: 'calculator',
  description:
    'Evaluate a mathematical expression and return the numeric result.',
  inputSchema: z.object({
    expression: z.string().describe('Math expression, e.g. "2 + 2 * 10"'),
  }),
  outputSchema: z.object({
    result: z.number(),
    expression: z.string(),
  }),
  execute: ({ expression }) => {
    const result = evalMathExpression(expression);
    return Promise.resolve({ result, expression });
  },
});

// Tiny recursive-descent evaluator for + - * / ( ) and decimal numbers — no
// dynamic code execution, throws a readable error on anything else. The
// grammar rules are mutually recursive, so they are hoisted function
// declarations rather than const arrows.
function evalMathExpression(expr: string): number {
  let pos = 0;
  const source = expr;

  /** Advance past spaces and tabs. */
  function skipWs(): void {
    while (
      pos < source.length &&
      (source[pos] === ' ' || source[pos] === '\t')
    ) {
      pos++;
    }
  }

  /** Parse a decimal number literal at the cursor. */
  function parseNumber(): number {
    skipWs();
    const start = pos;
    while (
      pos < source.length &&
      ((source[pos] >= '0' && source[pos] <= '9') || source[pos] === '.')
    ) {
      pos++;
    }
    if (start === pos) {
      throw new ExpectedError(
        `Unexpected character "${source[pos] ?? 'end of input'}" in expression`,
      );
    }
    const num = Number(source.slice(start, pos));
    if (Number.isNaN(num))
      throw new ExpectedError('Invalid number in expression');
    return num;
  }

  /** Parse unary +/-, parenthesised groups, or a number. */
  function parseFactor(): number {
    skipWs();
    const ch = source[pos];
    if (ch === '-') {
      pos++;
      return -parseFactor();
    }
    if (ch === '+') {
      pos++;
      return parseFactor();
    }
    if (ch === '(') {
      pos++;
      const inner = parseAddSub();
      skipWs();
      if (source[pos] !== ')')
        throw new ExpectedError('Unbalanced parentheses');
      pos++;
      return inner;
    }
    return parseNumber();
  }

  /** Parse a chain of * and / over factors. */
  function parseMulDiv(): number {
    let acc = parseFactor();
    for (;;) {
      skipWs();
      const ch = source[pos];
      if (ch === '*' || ch === '/') {
        pos++;
        const rhs = parseFactor();
        acc = ch === '*' ? acc * rhs : acc / rhs;
      } else {
        return acc;
      }
    }
  }

  /** Parse a chain of + and - over products. */
  function parseAddSub(): number {
    let acc = parseMulDiv();
    for (;;) {
      skipWs();
      const ch = source[pos];
      if (ch === '+' || ch === '-') {
        pos++;
        const rhs = parseMulDiv();
        acc = ch === '+' ? acc + rhs : acc - rhs;
      } else {
        return acc;
      }
    }
  }

  const value = parseAddSub();
  skipWs();
  if (pos < source.length) {
    throw new ExpectedError(
      `Unexpected character "${source[pos]}" in expression`,
    );
  }
  return value;
}

// ─── Chart visualization tool ─────────────────────────────────────────────────
//
// Returns a structured chart ARTIFACT. The chat UI detects it on the tool
// result and renders an interactive ECharts chart in the Preview panel — the
// agent no longer pastes any JSON. The same ChartSpec is reused by the document
// tools to embed an identical chart image into a PDF/DOCX/XLSX.

export const renderChartTool = createTool({
  id: 'render-chart',
  description:
    'Visualize data as an interactive chart (bar, horizontalBar, line, area, ' +
    'stackedBar, pie, donut, radar, combo, or scatter). The chart opens in the ' +
    'Preview panel beside the chat. Use this whenever the user asks to see data ' +
    'as a chart, graph, or plot. The returned chart id can be reused to embed ' +
    'the same chart inside a generated PDF/DOCX/XLSX document.',
  inputSchema: chartSpecSchema,
  outputSchema: z.object({ artifact: chartArtifactSchema }),
  execute: async (input) => {
    const spec = sanitizeChartSpec(input);
    const artifact = {
      id: newArtifactId('chart'),
      kind: 'chart' as const,
      title: spec.title,
      spec,
    };
    await storeArtifact(artifact);
    return { artifact };
  },
});

// Heterogeneous createTool instances; callers narrow per tool as needed.
export const BUILTIN_TOOLS: Record<string, ReturnType<typeof createTool>> = {
  webSearch: webSearchTool,
  fetchUrl: fetchUrlTool,
  calculator: calculatorTool,
  renderChart: renderChartTool,
  // No-ops with a clear message unless ERXES_AGENT_KNOWLEDGE=enable.
  companyKnowledge: companyKnowledgeTool,
  // Distilled lessons from past conversations. No-op unless
  // ERXES_AGENT_LEARNING=enable.
  agentKnowledge: agentKnowledgeTool,
  // Reads a file as text — a user attachment by key, or a file the agent
  // generated by artifactId (pdf/docx/xlsx/pptx/csv/…). Also force-bound outside
  // the policy filter — see agentRuntime — so files are always readable.
  fileReader: fileReaderTool,
  // Builder tools — the master-agent loop: guide → validate → simulate →
  // save → run/observe. Deny per agent via builtin:<key> when needed.
  ...WORKFLOW_BUILTIN_TOOLS,
  // Document generators (PDF/DOCX/XLSX). Each returns a downloadable artifact
  // shown in the Preview panel; charts embed via the render-chart spec.
  ...DOCUMENT_BUILTIN_TOOLS,
};

/** Look up a builtin tool by its registry key, or null when unknown. */
export function getBuiltinTool(builtinType: string) {
  return BUILTIN_TOOLS[builtinType] ?? null;
}
