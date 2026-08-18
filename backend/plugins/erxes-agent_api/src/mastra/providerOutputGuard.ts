const KIMI_REASONING_SEPARATOR = '<|close|>think<|sep|>';
const PROVIDER_CONTROL_TOKEN = /<\|(?:close|sep)\|>/gi;
const KIMI_CODING_MODEL = /(?:^|[/_-])kimi[-_]?for[-_]?coding(?:$|[/_-])/i;

/**
 * Kimi K3 is served through custom OpenAI-compatible gateways in some
 * deployments. Those gateways may put the model's reasoning separator in the
 * normal content stream instead of returning structured reasoning. Buffer its
 * text until the turn ends so a late separator cannot expose an already-sent
 * reasoning prefix.
 */
export function shouldGuardProviderOutput(model: string): boolean {
  return /(?:^|[/_-])kimi[-_]?k3(?:$|[/_-])/i.test(model.trim());
}

/** Models whose streamed text must be buffered until the turn ends. */
export function shouldBufferProviderText(model: string): boolean {
  const normalized = model.trim();
  return (
    shouldGuardProviderOutput(normalized) || KIMI_CODING_MODEL.test(normalized)
  );
}

export function sanitizeProviderText(raw: string): {
  text: string;
  leakedReasoning: boolean;
} {
  const markerIndex = raw.lastIndexOf(KIMI_REASONING_SEPARATOR);
  const leakedReasoning = markerIndex >= 0;
  const visible = leakedReasoning
    ? raw.slice(markerIndex + KIMI_REASONING_SEPARATOR.length)
    : raw;

  return {
    text: visible.replace(PROVIDER_CONTROL_TOKEN, '').trim(),
    leakedReasoning,
  };
}

/**
 * Read-time safety for turns persisted before the stream buffer existed.
 * Native Mastra parts contain every intermediate text block, while `content`
 * is the final assistant text. If a part contains the leaked separator, remove
 * all raw text parts and expose only a sanitized final reply.
 */
export function sanitizePersistedProviderOutput(
  content: string,
  parts: unknown[],
): { content: string; parts: unknown[] } {
  const textParts = parts.filter(
    (part): part is { type: 'text'; text: string } =>
      !!part &&
      typeof part === 'object' &&
      (part as { type?: unknown }).type === 'text' &&
      typeof (part as { text?: unknown }).text === 'string',
  );
  const allText = textParts.map((part) => part.text).join('');
  if (!sanitizeProviderText(allText).leakedReasoning) {
    return { content, parts };
  }

  const safeText =
    sanitizeProviderText(content).text || sanitizeProviderText(allText).text;

  return {
    content: safeText,
    parts: [
      ...parts.filter(
        (part) =>
          !part ||
          typeof part !== 'object' ||
          (part as { type?: unknown }).type !== 'text',
      ),
      { type: 'text', text: safeText },
    ],
  };
}
