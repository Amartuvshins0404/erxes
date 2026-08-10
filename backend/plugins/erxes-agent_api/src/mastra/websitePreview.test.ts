jest.mock('erxes-api-shared/utils', () => ({
  getSubdomain: jest.fn(),
}));
jest.mock('~/connectionResolvers', () => ({
  generateModels: jest.fn(),
}));

import {
  rewriteWebsiteText,
  websitePathCandidates,
  websiteRelativeBase,
} from './websitePreview';

describe('website preview paths', () => {
  const entryPath = 'index.html';

  it('normalizes site-relative paths and preserves HTML route fallbacks', () => {
    expect(websitePathCandidates('/guides/../about', entryPath)).toEqual([
      'about',
      'about.html',
      'about/index.html',
      entryPath,
    ]);
  });

  it('resolves directory routes without introducing empty path segments', () => {
    expect(websitePathCandidates('guides/', entryPath)).toEqual([
      'guides',
      'guides/index.html',
      entryPath,
    ]);
  });

  it('tries extensionless HTML files, directory indexes, then the SPA entry', () => {
    expect(websitePathCandidates('pricing', entryPath)).toEqual([
      'pricing',
      'pricing.html',
      'pricing/index.html',
      entryPath,
    ]);
    expect(websitePathCandidates('assets/app.js', entryPath)).toEqual([
      'assets/app.js',
    ]);
  });

  it.each([
    '..',
    '../secret.txt',
    '%2e%2e/secret.txt',
    'safe/%2e%2e/%2e%2e/secret',
  ])('rejects traversal path %s', (requestedPath) => {
    expect(websitePathCandidates(requestedPath, entryPath)).toEqual([]);
  });

  it('rejects malformed encoded paths', () => {
    expect(websitePathCandidates('%E0%A4%A', entryPath)).toEqual([]);
  });

  it('keeps rewritten site roots independent of gateway mount prefixes', () => {
    expect(websiteRelativeBase('index.html')).toBe('./');
    expect(websiteRelativeBase('pages/about.html')).toBe('../');
    expect(websiteRelativeBase('pages/team/index.html')).toBe('../../');
  });
});

describe('website preview URL rewriting', () => {
  const siteBase = '/pl:erxes-agent/websites/artifact-1/token-1';
  const base = `${siteBase}/`;

  it('rewrites local HTML URLs and installs the parent navigation bridge', () => {
    const html = [
      '<a href="http://localhost:5173/docs?tab=api#top">Docs</a>',
      '<form action="/submit"><img src="/assets/logo.svg" poster="/poster.jpg"></form>',
      '<a href="//cdn.example.com/library.js">CDN</a>',
      '<style>@import "/theme.css"; .hero { background: url(\'/hero.png\'); }</style>',
      '<script src="http://127.0.0.1:3000/app.js"></script>',
    ].join('');

    const rewritten = rewriteWebsiteText(
      html,
      'text/html; charset=utf-8',
      siteBase,
    );

    expect(rewritten).toContain(
      [
        `<a href="${base}docs?tab=api#top">Docs</a>`,
        `<form action="${base}submit"><img src="${base}assets/logo.svg" poster="${base}poster.jpg"></form>`,
        '<a href="//cdn.example.com/library.js">CDN</a>',
        `<style>@import "${base}theme.css"; .hero { background: url('${base}hero.png'); }</style>`,
        `<script src="${base}app.js"></script>`,
      ].join(''),
    );
    expect(rewritten).toContain('erxes-agent:website-preview:navigate');
    expect(rewritten).toContain(`const previewBase = "${base}"`);
  });

  it('rewrites root-relative and localhost CSS resources without touching external URLs', () => {
    const css = [
      '@import "/fonts.css";',
      '.hero { background: url(/images/hero.png); }',
      '.icon { mask: url("http://localhost:4173/icons.svg#menu"); }',
      '.external { background: url(https://cdn.example.com/image.png); }',
    ].join('\n');

    expect(rewriteWebsiteText(css, 'text/css', `${siteBase}/`)).toBe(
      [
        `@import "${base}fonts.css";`,
        `.hero { background: url(${base}images/hero.png); }`,
        `.icon { mask: url("${base}icons.svg#menu"); }`,
        '.external { background: url(https://cdn.example.com/image.png); }',
      ].join('\n'),
    );
  });

  it('only rewrites localhost origins in non-HTML and non-CSS text', () => {
    const javascript =
      'const api = "http://localhost:3000/api"; const root = "/local/path";';

    expect(rewriteWebsiteText(javascript, 'text/javascript', siteBase)).toBe(
      `const api = "${base}api"; const root = "/local/path";`,
    );
  });
});
