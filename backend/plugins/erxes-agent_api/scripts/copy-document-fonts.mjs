import { cpSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// tsc compiles .ts only, so the embedded PDF fonts (TTFs used by
// mastra/documents/pdf.ts for Cyrillic support) are not emitted into dist.
// Copy them so the compiled build resolves __dirname/fonts at runtime, matching
// the tsx-dev layout that serves straight from src/.
const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(pluginRoot, 'src/mastra/documents/fonts');
const dest = join(pluginRoot, 'dist/src/mastra/documents/fonts');

if (!existsSync(src)) {
  console.warn(`[copy-document-fonts] no fonts at ${src}, skipping`);
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`[copy-document-fonts] copied ${src} -> ${dest}`);
