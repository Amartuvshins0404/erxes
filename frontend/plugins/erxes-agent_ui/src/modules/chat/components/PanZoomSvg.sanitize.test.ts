/** @jest-environment jsdom */

import { sanitizeSvg } from '../hooks/usePanZoom';

describe('PanZoomSvg SVG sanitization', () => {
  it('strips <script> elements from injected SVG', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>window.__pwned = 1</script><rect width="10" height="10"/></svg>',
    );
    expect(out).not.toMatch(/<script/i);
    expect(out).not.toContain('__pwned');
    expect(out).toContain('<rect');
  });

  it('strips inline event handlers (onload / onclick)', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect onclick="alert(2)" width="10" height="10"/></svg>',
    );
    expect(out.toLowerCase()).not.toContain('onload');
    expect(out.toLowerCase()).not.toContain('onclick');
    expect(out.toLowerCase()).not.toContain('alert');
  });

  it('strips javascript: URLs in anchors', () => {
    const javascriptProtocol = ['java', 'script:'].join('');
    const out = sanitizeSvg(
      `<svg xmlns="http://www.w3.org/2000/svg"><a href="${javascriptProtocol}alert(1)"><text>x</text></a></svg>`,
    );
    expect(out.toLowerCase()).not.toContain(javascriptProtocol);
  });

  it('preserves legitimate diagram content (paths, text, styles, viewBox)', () => {
    const diagram =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">' +
      '<style>.node rect { fill: #eef; }</style>' +
      '<g class="node"><rect x="0" y="0" width="80" height="40" style="stroke:#333"/>' +
      '<path d="M0 0 L80 40" stroke="#333"/>' +
      '<text x="10" y="20" class="nodeLabel">Start</text></g>' +
      '</svg>';
    const out = sanitizeSvg(diagram);
    expect(out).toContain('viewBox="0 0 200 100"');
    expect(out).toContain('<path');
    expect(out).toContain('nodeLabel');
    expect(out).toContain('Start');
    expect(out).toContain('<style');
  });

  it('preserves foreignObject labels used by Mermaid html labels', () => {
    const out = sanitizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject width="100" height="30">' +
        '<div xmlns="http://www.w3.org/1999/xhtml" class="nodeLabel">Hello</div>' +
        '</foreignObject></svg>',
    );
    expect(out.toLowerCase()).toContain('foreignobject');
    expect(out).toContain('Hello');
  });
});
