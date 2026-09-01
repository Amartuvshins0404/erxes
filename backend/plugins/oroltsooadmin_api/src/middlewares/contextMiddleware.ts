import { NextFunction, Request, Response } from 'express';

import { generateModels, IModels } from '~/connectionResolvers';

const modelsCache: Record<string, IModels> = {};

export const contextMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { subdomain } = req.body || {};

  if (!subdomain) {
    return res.status(400).json({ message: 'subdomain is required' });
  }

  try {
    if (!modelsCache[subdomain]) {
      modelsCache[subdomain] = await generateModels(subdomain);
    }

    res.locals.subdomain = subdomain;
    res.locals.models = modelsCache[subdomain];

    next();
  } catch (error) {
    console.error(`Failed to load models for "${subdomain}"`, error);
    return res.status(500).json({ message: 'Failed to load tenant models' });
  }
};
