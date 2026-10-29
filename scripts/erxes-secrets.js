const crypto = require('node:crypto');
const path = require('node:path');

const SERVICE_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

const usage = () => {
  console.error(
    [
      'Usage:',
      '  pnpm erxes:secrets master          Print a new ERXES_MASTER_KEY',
      '  pnpm erxes:secrets service <name>  Print ERXES_SERVICE_TOKEN for a service',
    ].join('\n'),
  );
  process.exit(1);
};

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const loadEnvFile = () => {
  try {
    require('dotenv').config({
      path: path.resolve(__dirname, '..', '.env'),
    });
  } catch {
    return;
  }
};

const deriveServiceToken = (masterKey, serviceName) => {
  const key = Buffer.from(
    crypto.hkdfSync(
      'sha256',
      masterKey,
      'erxes-services',
      'service-token-v1',
      32,
    ),
  );

  return crypto
    .createHmac('sha256', key)
    .update(`service:${serviceName}`)
    .digest('base64url');
};

const [command, serviceName] = process.argv.slice(2);

if (command === 'master') {
  console.log(crypto.randomBytes(32).toString('base64url'));
} else if (command === 'service') {
  if (!serviceName || !SERVICE_NAME_PATTERN.test(serviceName)) {
    fail('Service name must contain only letters, digits, "-" or "_".');
  }

  loadEnvFile();

  const masterKey = process.env.ERXES_MASTER_KEY;

  if (!masterKey) {
    fail('ERXES_MASTER_KEY is not set in the environment or .env.');
  }

  console.log(deriveServiceToken(masterKey, serviceName));
} else {
  usage();
}
