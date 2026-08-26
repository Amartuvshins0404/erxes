import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  ContractError,
  PUBLIC_REPOSITORY,
  buildSummary,
  createImagePlan,
  discoverPublishedImages,
  getPublishedRelease,
  loadInventory,
  validateInventoryCoverage,
  validateVersion,
  verifyVersionedImages,
} from './release-contract.mjs';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const DIGEST_A = `sha256:${'a'.repeat(64)}`;
const DIGEST_B = `sha256:${'b'.repeat(64)}`;

test('accepts only exact stable 3.x.y versions', () => {
  assert.equal(validateVersion('3.0.92'), '3.0.92');
  assert.equal(validateVersion('3.12.0'), '3.12.0');
});

test('rejects malformed, prerelease, metadata, whitespace, aliases, and shell syntax', () => {
  const rejected = [
    '',
    'latest',
    'v3.0.92',
    '3.0',
    '3.0.92-rc.1',
    '3.0.92+build',
    '3.0.092',
    '4.0.0',
    ' 3.0.92',
    '3.0.92\n',
    '3.0.92; echo unsafe',
    '$(echo 3.0.92)',
  ];

  for (const value of rejected) {
    assert.throws(() => validateVersion(value), ContractError, value);
  }
});

test('rejects a mocked public GitHub release whose exact tag does not match', async () => {
  const release = {
    draft: false,
    html_url: 'https://github.com/erxes/erxes/releases/tag/3.0.91',
    id: 91,
    prerelease: false,
    published_at: '2026-08-23T00:00:00Z',
    tag_name: '3.0.91',
  };

  const fetchImpl = async () => ({
    headers: {
      get: (name) =>
        name === 'content-type' ? 'application/json; charset=utf-8' : null,
    },
    json: async () => release,
    ok: true,
  });

  await assert.rejects(
    getPublishedRelease(PUBLIC_REPOSITORY, '3.0.92', { fetchImpl }),
    /does not exactly match/,
  );
});

test('rejects an incomplete reviewed image inventory', () => {
  const published = discoverPublishedImages(ROOT);
  const incomplete = published.slice(1);

  assert.throws(
    () => validateInventoryCoverage(incomplete, published),
    /inventory is incomplete/,
  );
});

test('rejects a missing required latest source image', async () => {
  const images = loadInventory(ROOT).slice(0, 2);
  const inspectManifest = (image, tag) => {
    if (image === images[1] && tag === 'latest') {
      return null;
    }
    return tag === 'latest' ? DIGEST_A : null;
  };

  await assert.rejects(
    createImagePlan({ images, inspectManifest, version: '3.0.92' }),
    /Required source image is missing/,
  );
});

test('rejects a conflicting existing version digest', async () => {
  const images = loadInventory(ROOT).slice(0, 1);
  const inspectManifest = (_image, tag) =>
    tag === 'latest' ? DIGEST_A : DIGEST_B;

  await assert.rejects(
    createImagePlan({ images, inspectManifest, version: '3.0.92' }),
    /Existing version tag conflicts/,
  );
});

test('builds and verifies a complete idempotent release plan', async () => {
  const images = loadInventory(ROOT);
  const existingImage = images[0];
  const inspectForPlan = (image, tag) => {
    if (tag === 'latest' || image === existingImage) {
      return DIGEST_A;
    }
    return null;
  };

  const plan = await createImagePlan({
    images,
    inspectManifest: inspectForPlan,
    version: '3.0.92',
  });

  assert.equal(plan.length, images.length);
  assert.equal(plan[0].action, 'preserve');
  assert.ok(plan.slice(1).every((item) => item.action === 'create'));

  const verification = await verifyVersionedImages({
    inspectManifest: () => DIGEST_A,
    plan,
    version: '3.0.92',
  });
  assert.deepEqual(verification.failed, []);
  assert.equal(verification.verified.length, images.length);
});

test('summary allowlists release facts and excludes credentials and raw responses', () => {
  const inventory = loadInventory(ROOT);
  const secret = 'registry-token-should-never-appear';
  const rawRegistryResponse = `Authorization: Bearer ${secret}`;
  const summary = buildSummary({
    finalStatus: 'PASS',
    inventory,
    preflightVersion: '3.0.92',
    privateIdentity: `3.0.92@${'c'.repeat(40)}`,
    publicReleaseUrl: 'https://github.com/erxes/erxes/releases/tag/3.0.92',
    rawRegistryResponse,
    registryPassword: secret,
    requestedVersion: '3.0.92',
    verifiedImages: inventory.map((image) => ({ digest: DIGEST_A, image })),
  });

  assert.match(summary, /Verified image count: 14/);
  assert.match(summary, /Final status: \*\*PASS\*\*/);
  assert.doesNotMatch(summary, new RegExp(secret));
  assert.doesNotMatch(summary, /Authorization:/);
  assert.doesNotMatch(summary, /rawRegistryResponse/);
});

test('every CI-published latest image is in the single release inventory', () => {
  const inventory = loadInventory(ROOT);
  const published = discoverPublishedImages(ROOT);

  assert.deepEqual(inventory, published);
  assert.equal(inventory.length, 14);
});

test('release workflow uses gated release and repair triggers without tag-push release', () => {
  const workflow = readFileSync(
    path.join(ROOT, '.github/workflows/release.yml'),
    'utf8',
  );

  assert.match(workflow, /^\s*release:\s*$/m);
  assert.match(workflow, /^\s*workflow_dispatch:\s*$/m);
  assert.doesNotMatch(workflow, /^\s*push:\s*$/m);
  assert.match(workflow, /needs:\n\s+- preflight/);
  assert.match(workflow, /verify-metadata/);
  assert.match(workflow, /verify-images/);
  assert.match(workflow, /verify-tags/);
});

test('release-it disables implicit increments and pins private changelog links', () => {
  const config = JSON.parse(
    readFileSync(path.join(ROOT, '.release-it.json'), 'utf8'),
  );
  const changelog = config.plugins['@release-it/conventional-changelog'];

  assert.equal(config.increment, false);
  assert.equal(config.git.pushRepo, 'origin');
  assert.equal(config.git.requireBranch, 'main');
  assert.equal(changelog.context.host, 'https://github.com');
  assert.equal(changelog.context.owner, 'erxes');
  assert.equal(changelog.context.repository, 'erxes-private');
});

test('release-it runtime keeps implicit increment disabled but accepts one exact override', async () => {
  const { Config } = await import('release-it');
  const implicit = new Config({ configDir: ROOT });
  const exact = new Config({ configDir: ROOT, increment: '3.0.92' });

  assert.equal(implicit.options.increment, false);
  assert.equal(exact.options.increment, '3.0.92');
});
