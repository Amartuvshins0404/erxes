import { readFileSync } from 'fs';
import { join } from 'path';

// Mermaid is ESM-only and the diagram renderer needs a full browser layout
// engine, so a live render can't run under this jest harness. This guard
// instead locks the security-critical configuration in source: the diagram
// definitions are LLM-authored and the produced SVG is injected via
// dangerouslySetInnerHTML in PanZoomSvg, so Mermaid MUST run in 'strict' mode
// (HTML-escapes labels, disables click/href/script directives). If anyone
// reintroduces 'loose' (or removes the strict setting), this test fails.
describe('Mermaid security configuration (finding E)', () => {
  const hookSource = readFileSync(
    join(__dirname, '..', 'hooks', 'useMermaidRender.ts'),
    'utf8',
  );
  const viewerSource = readFileSync(join(__dirname, 'MermaidViewer.tsx'), 'utf8');

  it("initializes mermaid with securityLevel 'strict'", () => {
    expect(hookSource).toMatch(/securityLevel:\s*['"]strict['"]/);
  });

  it("never uses the unsafe 'loose' security level", () => {
    expect(hookSource).not.toMatch(/securityLevel:\s*['"]loose['"]/);
  });

  it('passes the rendered SVG straight to PanZoomSvg (the injection sink)', () => {
    // Confirms the sink this guard protects still exists where we expect it,
    // so the strict-mode requirement keeps applying to that exact path.
    expect(viewerSource).toMatch(/<PanZoomSvg\s+svgHtml=\{svgHtml\}/);
  });
});
