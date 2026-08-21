import { isDev } from 'erxes-api-shared/utils';
import { NextFunction } from 'express';
import { IMAGE_FIELDS } from '~/constants';
import { IImageFields, IRequest, IResponse } from '~/types';

const { BLOCK_API_URL = '' } = process.env || {};

export const modifierMiddleware = (
  req: IRequest<IImageFields, {}>,
  res: IResponse,
  next: NextFunction,
) => {
  if (!BLOCK_API_URL && !isDev) {
    throw new Error('BLOCK_API_URL is not set');
  }

  try {
    const { subdomain, payload } = req.body || {};

    const { data } = payload || {};

    const { input = {} } = data || {};

    const BLOCK_DOMAIN = isDev
      ? 'http://localhost:4000'
      : BLOCK_API_URL.replace('<subdomain>', subdomain);

    if (IMAGE_FIELDS.some((image_field) => input.hasOwnProperty(image_field))) {
      for (const field of IMAGE_FIELDS) {
        if (!Object.prototype.hasOwnProperty.call(input, field)) continue;

        const value = input[field];

        if (Array.isArray(value)) {
          const newValues: string[] = [];

          for (const image of value) {
            if (image.startsWith(BLOCK_DOMAIN)) {
              newValues.push(image);
            } else {
              newValues.push(`${BLOCK_DOMAIN}/read-file?key=${image}`);
            }
          }

          input[field] = newValues;
        } else if (
          value &&
          typeof value === 'string' &&
          !value.startsWith(BLOCK_DOMAIN)
        ) {
          input[field] = `${BLOCK_DOMAIN}/read-file?key=${value}`;
        }
      }
    }

    next();
  } catch (error) {
    console.error('Invalid request', error);
    return res.status(401).json({ message: 'Invalid request', error });
  }
};
