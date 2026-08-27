import crypto from 'crypto';

const { OROLTSOO_ADMIN_API_URL, OROLTSOO_ADMIN_SECRET } = process.env;

interface ISyncPayload {
  entityId: string;
  data?: Record<string, unknown>;
}

export const sendToAdmin = ({
  subdomain,
  path,
  payload,
}: {
  subdomain: string;
  path: string;
  payload: ISyncPayload;
}) => {
  if (!OROLTSOO_ADMIN_API_URL || !OROLTSOO_ADMIN_SECRET) {
    console.error(
      'OROLTSOO_ADMIN_API_URL or OROLTSOO_ADMIN_SECRET is not set; skipping admin sync',
    );
    return;
  }

  try {
    const body = JSON.stringify({ subdomain, payload });

    const signature = crypto
      .createHmac('sha256', OROLTSOO_ADMIN_SECRET)
      .update(body)
      .digest('hex');

    fetch(`${OROLTSOO_ADMIN_API_URL}/webhook/${path}`, {
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
            `Webhook "${path}" to oroltsooadmin returned ${response.status}: ${await response
              .text()
              .catch(() => '')}`,
          );
        }
      })
      .catch((error) => {
        console.error(`Failed to send "${path}" to oroltsooadmin: ${error}`);
      });
  } catch (error) {
    console.error(`Failed to build "${path}" payload for oroltsooadmin: ${error}`);
  }
};
