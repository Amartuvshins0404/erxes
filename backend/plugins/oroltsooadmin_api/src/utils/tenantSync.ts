import crypto from 'crypto';

const { OROLTSOO_API_URL, OROLTSOO_ADMIN_SECRET } = process.env;

interface ISyncPayload {
  entityId: string;
  data?: Record<string, unknown>;
}

export const sendToTenant = ({
  subdomain,
  path,
  payload,
}: {
  subdomain: string;
  path: string;
  payload: ISyncPayload;
}) => {
  if (!OROLTSOO_API_URL || !OROLTSOO_ADMIN_SECRET) {
    console.error(
      'OROLTSOO_API_URL or OROLTSOO_ADMIN_SECRET is not set; skipping tenant sync',
    );
    return;
  }

  try {
    const body = JSON.stringify({ subdomain, payload });

    const signature = crypto
      .createHmac('sha256', OROLTSOO_ADMIN_SECRET)
      .update(body)
      .digest('hex');

    const endpoint = `${OROLTSOO_API_URL.replace(
      '<subdomain>',
      subdomain,
    )}/webhook/${path}`;

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': `sha256=${signature}`,
      },
      body,
    })
      .then(async (response) => {
        if (!response.ok) {
          console.error(
            `Webhook "${path}" to ${subdomain} returned ${response.status}: ${await response
              .text()
              .catch(() => '')}`,
          );
        }
      })
      .catch((error) => {
        console.error(`Failed to send "${path}" to ${subdomain}: ${error}`);
      });
  } catch (error) {
    console.error(`Failed to build "${path}" payload for ${subdomain}: ${error}`);
  }
};
