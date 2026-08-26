import { spawnSync } from 'node:child_process';

import {
  ContractError,
  PRIVATE_REPOSITORY,
  PUBLIC_REPOSITORY,
  getPublishedRelease,
  validateVersion,
} from './release-contract.mjs';

const verifyPrivateOrigin = () => {
  const result = spawnSync('git', ['remote', 'get-url', 'origin'], {
    encoding: 'utf8',
    timeout: 10_000,
  });

  if (result.status !== 0 || result.error) {
    throw new ContractError('Cannot verify the private origin remote.');
  }

  const normalized = (result.stdout || '')
    .trim()
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/\.git$/, '');

  if (normalized !== `https://github.com/${PRIVATE_REPOSITORY}`) {
    throw new ContractError('The origin remote is not erxes/erxes-private.');
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    throw new ContractError('Usage: pnpm release -- <exact-public-version>');
  }

  const version = validateVersion(args[0]);
  verifyPrivateOrigin();
  const publicRelease = await getPublishedRelease(PUBLIC_REPOSITORY, version, {
    token: process.env.GITHUB_TOKEN,
  });

  process.stdout.write(
    `Verified published public release: ${publicRelease.url}\n`,
  );
  process.stdout.write(
    `Starting private release with exact version ${version}.\n`,
  );

  const result = spawnSync('pnpm', ['exec', 'release-it', version], {
    stdio: 'inherit',
  });

  if (result.error || result.signal || result.status !== 0) {
    throw new ContractError('release-it did not complete successfully.');
  }
};

main().catch((error) => {
  const message =
    error instanceof ContractError
      ? error.message
      : 'Unexpected private release failure.';
  process.stderr.write(`Private release stopped: ${message}\n`);
  process.exitCode = 1;
});
