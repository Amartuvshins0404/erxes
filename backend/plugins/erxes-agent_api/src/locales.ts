import { readFileSync, realpathSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import type { Router } from 'express';

const LOCALE_FILE = 'erxes-agent.json';
const SUPPORTED_LANGUAGES = new Set(['en', 'mn']);
const localesRoot = realpathSync(join(__dirname, 'locales'));

export const registerAgentLocaleRoutes = (router: Router): void => {
  router.get('/locales/:lng/:file', (req, res) => {
    const { lng, file } = req.params;
    if (!SUPPORTED_LANGUAGES.has(lng) || file !== LOCALE_FILE) {
      return res.status(404).send('Not found');
    }

    try {
      const requestedPath = resolve(localesRoot, lng, file);
      const realPath = realpathSync(requestedPath);
      if (!realPath.startsWith(`${localesRoot}${sep}`)) {
        return res.status(403).send('Forbidden');
      }

      return res.json(JSON.parse(readFileSync(realPath, 'utf8')));
    } catch {
      return res.status(404).send('Not found');
    }
  });
};
