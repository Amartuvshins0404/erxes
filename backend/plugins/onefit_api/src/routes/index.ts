import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { getSubdomain, getEnv } from 'erxes-api-shared/utils';
import { contextMiddleware } from '~/middlewares/contextMiddleware';
import { validationMiddleware } from '~/middlewares/validationMiddleware';
import {
  isSlaveMode,
  getOneFitInstanceId,
  getOneFitSecret,
} from '~/constants/mode';
import { getMasterClient } from '~/utils/masterClient';
import { filterXSS } from 'xss';
import { decodeQrFromImagePath } from '~/utils/qrDecoder';
// import { modifierMiddleware } from '~/middlewares/modifierMiddleware';

const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const router: Router = Router();

router.use('/webhook', [validationMiddleware, contextMiddleware], []);

const DOMAIN = getEnv({ name: 'DOMAIN' });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  }),
});

router.post(
  '/upload-file',
  upload.any(),
  async (req: Request, res: Response) => {
    const subdomain = getSubdomain(req);
    const maxHeight = Number(req.query.maxHeight) || 0;
    const maxWidth = Number(req.query.maxWidth) || 0;
    const kind = (req.query.kind as string) || 'main';

    const files = req.files as Express.Multer.File[] | undefined;
    const file = files?.[0];

    if (!file?.path) {
      return res.status(400).send('No file uploaded');
    }

    const mimetype = file.mimetype;

    if (!mimetype) {
      return res
        .status(400)
        .send('One or more files have unrecognized MIME type');
    }

    try {
      // If in slave mode, forward to master (only when instanceId is set)
      if (isSlaveMode()) {
        const instanceId = await getOneFitInstanceId(subdomain);
        if (!instanceId) {
          return res
            .status(503)
            .send(filterXSS('Instance ID is required to upload in slave mode'));
        }
        try {
          const masterClient = getMasterClient();
          const onefitSecret = getOneFitSecret();

          const headers: Record<string, string> = {};
          if (subdomain) {
            headers['x-subdomain'] = subdomain;
          }
          headers['x-onefit-instance-id'] = instanceId;
          if (req.headers.authorization) {
            headers['authorization'] = req.headers.authorization as string;
          }
          if (onefitSecret) {
            headers['cookie'] = `auth-token=${onefitSecret}`;
          }
          if (req.headers.cookie) {
            const existingCookies = headers['cookie'] || '';
            headers['cookie'] = existingCookies
              ? `${existingCookies}; ${req.headers.cookie}`
              : (req.headers.cookie as string);
          }

          const result = await masterClient.uploadFile(
            {
              filePath: file.path,
              fileName: file.originalname || 'file',
              mimetype: file.mimetype,
              maxHeight: maxHeight || undefined,
              maxWidth: maxWidth || undefined,
              kind,
            },
            headers,
          );

          return res.send(result);
        } catch (masterError: any) {
          console.error('Master upload error:', masterError);
          return res
            .status(500)
            .send(
              filterXSS(
                `Failed to upload file to master: ${masterError.message}`,
              ),
            );
        }
      }

      // Master mode: forward to core-api upload endpoint
      const domain = DOMAIN.replace('<subdomain>', subdomain);
      const coreUploadUrl = `${domain}/gateway/pl:core/upload-file`;

      const queryParams = new URLSearchParams();
      if (kind) {
        queryParams.append('kind', kind);
      }
      if (maxHeight) {
        queryParams.append('maxHeight', maxHeight.toString());
      }
      if (maxWidth) {
        queryParams.append('maxWidth', maxWidth.toString());
      }

      const uploadUrl = `${coreUploadUrl}${
        queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;

      const formData = new FormData();
      formData.append('file', fs.createReadStream(file.path), {
        filename: file.originalname || 'file',
        contentType: mimetype,
      });

      const headers: Record<string, string> = {
        ...formData.getHeaders(),
      };

      if (req.headers.authorization) {
        headers['authorization'] = req.headers.authorization as string;
      }
      if (req.headers.cookie) {
        headers['cookie'] = req.headers.cookie as string;
      }
      if (subdomain) {
        headers['x-subdomain'] = subdomain;
      }
      if (req.headers.source) {
        headers['source'] = req.headers.source as string;
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res
          .status(response.status)
          .send(
            filterXSS(
              `Core API upload failed: ${response.status} ${response.statusText} - ${errorText}`,
            ),
          );
      }

      const result = await response.text();
      return res.send(result);
    } catch (e: any) {
      console.error('Upload error:', e);
      return res.status(500).send(filterXSS(e.message || 'Upload failed'));
    }
  },
);

router.post(
  '/decode-qr',
  upload.any(),
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[] | undefined;
    const file = files?.[0];

    if (!file?.path) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const mimetype = file.mimetype;
    if (!mimetype || !ALLOWED_IMAGE_MIMES.includes(mimetype)) {
      try {
        fs.unlinkSync(file.path);
      } catch {
        // ignore
      }
      return res.status(400).json({
        error: 'Invalid or unsupported image',
      });
    }

    try {
      const result = await decodeQrFromImagePath(file.path);

      try {
        fs.unlinkSync(file.path);
      } catch {
        // ignore cleanup errors
      }

      return res.status(200).json(result);
    } catch (e: unknown) {
      try {
        fs.unlinkSync(file.path);
      } catch {
        // ignore
      }
      const message = e instanceof Error ? e.message : 'Decode failed';
      return res.status(500).json({
        error: filterXSS(message),
      });
    }
  },
);

export { router };
