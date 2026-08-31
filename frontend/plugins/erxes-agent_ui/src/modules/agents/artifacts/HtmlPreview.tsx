const CSP_DIRECTIVES =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; base-uri 'none'; form-action 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'";

/**
 * Injects our CSP meta as the first policy so it applies even before any
 * model-provided meta CSP; when several CSPs are present the browser
 * enforces their intersection, so a model-provided policy can only make
 * things stricter, never weaker.
 */
export const buildSandboxedSrcDoc = (html: string): string => {
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${CSP_DIRECTIVES}">`;

  if (/<!doctype\s[^>]*>/i.test(html)) {
    return html.replace(/<!doctype\s[^>]*>/i, (match) => `${match}\n${cspMeta}`);
  }

  if (/<html(\s[^>]*)?>/i.test(html)) {
    return html.replace(/<html(\s[^>]*)?>/i, (match) => `${match}\n${cspMeta}`);
  }

  if (/<head(\s[^>]*)?>/i.test(html)) {
    return html.replace(/<head(\s[^>]*)?>/i, (match) => `${match}\n${cspMeta}`);
  }

  return `${cspMeta}\n${html}`;
};

export const HtmlPreview = ({ html }: { html: string }) => (
  <iframe
    title="HTML artifact preview"
    sandbox="allow-scripts"
    srcDoc={buildSandboxedSrcDoc(html)}
    referrerPolicy="no-referrer"
    className="h-full w-full rounded-lg border bg-white"
  />
);
