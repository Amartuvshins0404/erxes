import { cpSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// tsc compiles .ts only, so runtime assets are not emitted into dist. Copy the
// embedded PDF fonts, locale JSON, and file-based Mastra skills while preserving
// their source layout for both compiled production code and tsx development.
const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const assets = [
  {
    source: 'src/mastra/documents/fonts',
    destination: 'dist/src/mastra/documents/fonts',
  },
  {
    source: 'src/locales',
    destination: 'dist/src/locales',
  },
  {
    source: 'skills',
    destination: 'dist/skills',
  },
];

for (const asset of assets) {
  const source = join(pluginRoot, asset.source);
  const destination = join(pluginRoot, asset.destination);
  if (!existsSync(source)) {
    console.warn(`[copy-document-fonts] no assets at ${source}, skipping`);
    continue;
  }

  mkdirSync(destination, { recursive: true });
  cpSync(source, destination, { recursive: true });
  console.log(`[copy-document-fonts] copied ${source} -> ${destination}`);
}
