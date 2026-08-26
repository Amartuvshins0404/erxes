import { appendFileSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PUBLIC_REPOSITORY = 'erxes/erxes';
export const PRIVATE_REPOSITORY = 'erxes/erxes-private';

const VERSION_PATTERN = /^3\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const IMAGE_PATTERN = /^erxes\/erxes-next-[a-z0-9][a-z0-9_-]*$/;
const DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/;
const DOCKER_TIMEOUT_MS = 30_000;
const GITHUB_TIMEOUT_MS = 15_000;
const MAX_COMMAND_OUTPUT = 1024 * 1024;
const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

const writeLine = (message) => process.stdout.write(`${message}\n`);

export class ContractError extends Error {}

export const validateVersion = (value) => {
  if (typeof value !== 'string' || !VERSION_PATTERN.test(value)) {
    throw new ContractError(
      'Version must exactly match stable project SemVer 3.x.y with no prefix, suffix, metadata, or whitespace.',
    );
  }

  return value;
};

export const validateImage = (value) => {
  if (typeof value !== 'string' || !IMAGE_PATTERN.test(value)) {
    throw new ContractError(
      'Release inventory contains an invalid image repository name.',
    );
  }

  return value;
};

export const validateDigest = (value) => {
  if (typeof value !== 'string' || !DIGEST_PATTERN.test(value)) {
    throw new ContractError('Registry returned an invalid manifest digest.');
  }

  return value;
};

export const validateInventory = (images) => {
  if (!Array.isArray(images) || images.length === 0) {
    throw new ContractError(
      'Release image inventory must be a non-empty array.',
    );
  }

  const validated = images.map(validateImage);
  const unique = new Set(validated);

  if (unique.size !== validated.length) {
    throw new ContractError(
      'Release image inventory contains duplicate repositories.',
    );
  }

  const sorted = [...validated].sort();
  if (JSON.stringify(sorted) !== JSON.stringify(validated)) {
    throw new ContractError(
      'Release image inventory must be sorted for reviewability.',
    );
  }

  return validated;
};

const readJson = (filePath, label) => {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    throw new ContractError(`${label} is missing or is not valid JSON.`);
  }
};

export const loadInventory = (root = ROOT) => {
  const inventory = readJson(
    path.join(root, '.github/release-images.json'),
    'Release image inventory',
  );

  if (inventory?.schemaVersion !== 1) {
    throw new ContractError(
      'Release image inventory has an unsupported schema version.',
    );
  }

  return validateInventory(inventory.images);
};

export const discoverPublishedImages = (root = ROOT) => {
  const workflowsDirectory = path.join(root, '.github/workflows');
  const workflowNames = readdirSync(workflowsDirectory).filter((name) =>
    /^ci-.*\.ya?ml$/.test(name),
  );
  const images = new Set();

  for (const workflowName of workflowNames) {
    const source = readFileSync(
      path.join(workflowsDirectory, workflowName),
      'utf8',
    );
    const matches = source.matchAll(
      /^\s*(erxes\/erxes-next-[a-z0-9][a-z0-9_-]*):latest\s*$/gm,
    );

    for (const match of matches) {
      images.add(validateImage(match[1]));
    }
  }

  return [...images].sort();
};

export const validateInventoryCoverage = (inventory, publishedImages) => {
  const expected = validateInventory(inventory);
  const published = validateInventory([...publishedImages].sort());
  const expectedSet = new Set(expected);
  const publishedSet = new Set(published);
  const missing = published.filter((image) => !expectedSet.has(image));
  const unbuilt = expected.filter((image) => !publishedSet.has(image));

  if (missing.length > 0) {
    throw new ContractError(
      `Release image inventory is incomplete; missing CI images: ${missing.join(
        ', ',
      )}.`,
    );
  }

  if (unbuilt.length > 0) {
    throw new ContractError(
      `Release image inventory contains images without a CI latest publisher: ${unbuilt.join(
        ', ',
      )}.`,
    );
  }

  return expected;
};

const isPublishedDate = (value) =>
  typeof value === 'string' &&
  value.length > 0 &&
  !Number.isNaN(Date.parse(value));

export const verifyPublishedRelease = (release, version, repository) => {
  validateVersion(version);

  if (!release || typeof release !== 'object') {
    throw new ContractError(`The ${repository} release response is invalid.`);
  }

  if (release.tag_name !== version) {
    throw new ContractError(
      `The ${repository} release tag does not exactly match the requested version.`,
    );
  }

  if (
    release.draft !== false ||
    release.prerelease !== false ||
    !isPublishedDate(release.published_at)
  ) {
    throw new ContractError(
      `The ${repository} release is not a published stable release.`,
    );
  }

  const expectedUrl = `https://github.com/${repository}/releases/tag/${version}`;
  if (release.html_url !== expectedUrl) {
    throw new ContractError(`The ${repository} release URL is invalid.`);
  }

  if (!Number.isInteger(release.id) || release.id <= 0) {
    throw new ContractError(`The ${repository} release identity is invalid.`);
  }

  return {
    id: release.id,
    tag: release.tag_name,
    url: release.html_url,
  };
};

const githubJson = async (apiPath, { token, fetchImpl = fetch } = {}) => {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetchImpl(`https://api.github.com${apiPath}`, {
      headers,
      redirect: 'error',
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
    });
  } catch {
    throw new ContractError('GitHub API request failed or timed out.');
  }

  if (!response || !response.ok) {
    throw new ContractError('GitHub API returned an unsuccessful response.');
  }

  if (response.headers?.get?.('link')) {
    throw new ContractError('Unexpected paginated GitHub API response.');
  }

  const contentType = response.headers?.get?.('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new ContractError('GitHub API returned a non-JSON response.');
  }

  try {
    return await response.json();
  } catch {
    throw new ContractError('GitHub API returned malformed JSON.');
  }
};

export const getPublishedRelease = async (
  repository,
  version,
  { token, fetchImpl = fetch } = {},
) => {
  validateVersion(version);
  const release = await githubJson(
    `/repos/${repository}/releases/tags/${encodeURIComponent(version)}`,
    { token, fetchImpl },
  );

  return verifyPublishedRelease(release, version, repository);
};

const resolvePrivateTagCommit = async (version, options) => {
  const tagRef = await githubJson(
    `/repos/${PRIVATE_REPOSITORY}/git/ref/tags/${encodeURIComponent(version)}`,
    options,
  );

  if (tagRef?.ref !== `refs/tags/${version}` || !tagRef.object) {
    throw new ContractError(
      'Private Git tag does not exactly match the requested version.',
    );
  }

  let object = tagRef.object;
  const visited = new Set();

  for (let depth = 0; depth < 5; depth += 1) {
    if (!object || !COMMIT_PATTERN.test(object.sha || '')) {
      throw new ContractError('Private Git tag target is invalid.');
    }

    if (object.type === 'commit') {
      return object.sha;
    }

    if (object.type !== 'tag' || visited.has(object.sha)) {
      throw new ContractError(
        'Private Git tag cannot be resolved to one commit.',
      );
    }

    visited.add(object.sha);
    const annotatedTag = await githubJson(
      `/repos/${PRIVATE_REPOSITORY}/git/tags/${object.sha}`,
      options,
    );
    object = annotatedTag?.object;
  }

  throw new ContractError(
    'Private Git tag nesting exceeds the verification limit.',
  );
};

const verifyTaggedPackageVersion = async (commit, version, options) => {
  const packageFile = await githubJson(
    `/repos/${PRIVATE_REPOSITORY}/contents/package.json?ref=${commit}`,
    options,
  );

  if (
    packageFile?.encoding !== 'base64' ||
    typeof packageFile.content !== 'string' ||
    packageFile.content.length > MAX_COMMAND_OUTPUT
  ) {
    throw new ContractError('Private tagged package metadata is invalid.');
  }

  let packageJson;
  try {
    const content = Buffer.from(
      packageFile.content.replace(/\s/g, ''),
      'base64',
    ).toString('utf8');
    packageJson = JSON.parse(content);
  } catch {
    throw new ContractError(
      'Private tagged package metadata cannot be parsed.',
    );
  }

  if (packageJson?.version !== version) {
    throw new ContractError(
      'Private tagged package version does not match the requested version.',
    );
  }
};

export const verifyGitHubState = async ({
  version,
  token,
  eventTag,
  eventReleaseId,
  fetchImpl = fetch,
}) => {
  validateVersion(version);

  if (eventTag && eventTag !== version) {
    throw new ContractError(
      'Private release event tag does not match the requested version.',
    );
  }

  const options = { token, fetchImpl };
  const publicRelease = await getPublishedRelease(
    PUBLIC_REPOSITORY,
    version,
    options,
  );
  const privateRelease = await getPublishedRelease(
    PRIVATE_REPOSITORY,
    version,
    options,
  );

  if (eventReleaseId && Number(eventReleaseId) !== privateRelease.id) {
    throw new ContractError(
      'Private release event identity does not match the published release.',
    );
  }

  const commit = await resolvePrivateTagCommit(version, options);
  await verifyTaggedPackageVersion(commit, version, options);

  return {
    commit,
    privateRelease,
    publicRelease,
  };
};

const dockerCommand = (args, { allowMissing = false } = {}) => {
  const result = spawnSync('docker', args, {
    encoding: 'utf8',
    maxBuffer: MAX_COMMAND_OUTPUT,
    timeout: DOCKER_TIMEOUT_MS,
  });

  if (result.error || result.signal || result.status === null) {
    throw new ContractError('Docker registry command failed or timed out.');
  }

  if (result.status !== 0) {
    const diagnostic = `${result.stderr || ''}\n${
      result.stdout || ''
    }`.toLowerCase();
    const missing = /(manifest unknown|no such manifest|not found)/.test(
      diagnostic,
    );
    if (allowMissing && missing) {
      return null;
    }

    throw new ContractError(
      'Docker registry command returned an unsuccessful response.',
    );
  }

  return result.stdout;
};

export const inspectDockerManifest = (
  image,
  tag,
  { allowMissing = false } = {},
) => {
  validateImage(image);
  if (tag !== 'latest') {
    validateVersion(tag);
  }

  const output = dockerCommand(
    [
      'buildx',
      'imagetools',
      'inspect',
      '--format',
      '{{json .Manifest}}',
      `${image}:${tag}`,
    ],
    { allowMissing },
  );

  if (output === null) {
    return null;
  }

  let manifest;
  try {
    manifest = JSON.parse(output);
  } catch {
    throw new ContractError(
      'Docker registry returned malformed manifest metadata.',
    );
  }

  return validateDigest(manifest?.digest);
};

export const createImagePlan = async ({ images, version, inspectManifest }) => {
  validateVersion(version);
  const inventory = validateInventory(images);
  const plan = [];

  for (const image of inventory) {
    const sourceDigest = await inspectManifest(image, 'latest', {
      allowMissing: false,
    });
    if (sourceDigest === null) {
      throw new ContractError(
        `Required source image is missing: ${image}:latest.`,
      );
    }
    validateDigest(sourceDigest);

    const existingDigest = await inspectManifest(image, version, {
      allowMissing: true,
    });
    if (existingDigest !== null && existingDigest !== sourceDigest) {
      throw new ContractError(
        `Existing version tag conflicts with the verified source: ${image}.`,
      );
    }

    plan.push({
      action: existingDigest === sourceDigest ? 'preserve' : 'create',
      image,
      source_digest: sourceDigest,
    });
  }

  return plan;
};

const validatePlan = (value, version) => {
  validateVersion(version);
  if (!Array.isArray(value) || value.length === 0) {
    throw new ContractError('Release image plan is empty or invalid.');
  }

  const images = validateInventory(value.map((item) => item?.image));

  return value.map((item, index) => {
    if (!['create', 'preserve'].includes(item?.action)) {
      throw new ContractError('Release image plan contains an invalid action.');
    }

    return {
      action: item.action,
      image: images[index],
      source_digest: validateDigest(item.source_digest),
    };
  });
};

const parsePlan = (value, version) => {
  try {
    return validatePlan(JSON.parse(value), version);
  } catch (error) {
    if (error instanceof ContractError) {
      throw error;
    }
    throw new ContractError('Release image plan is not valid JSON.');
  }
};

export const tagImage = ({ image, sourceDigest, version }) => {
  validateImage(image);
  validateDigest(sourceDigest);
  validateVersion(version);

  const currentSource = inspectDockerManifest(image, 'latest');
  if (currentSource !== sourceDigest) {
    throw new ContractError(
      `Verified source manifest changed before tagging: ${image}.`,
    );
  }

  const existing = inspectDockerManifest(image, version, {
    allowMissing: true,
  });
  if (existing !== null) {
    if (existing !== sourceDigest) {
      throw new ContractError(
        `Existing version tag conflicts with the verified source: ${image}.`,
      );
    }

    return 'preserved';
  }

  dockerCommand([
    'buildx',
    'imagetools',
    'create',
    '--prefer-index=false',
    '--tag',
    `${image}:${version}`,
    `${image}@${sourceDigest}`,
  ]);

  const created = inspectDockerManifest(image, version);
  if (created !== sourceDigest) {
    throw new ContractError(
      `Created version tag failed digest verification: ${image}.`,
    );
  }

  return 'created';
};

export const verifyVersionedImages = async ({
  plan,
  version,
  inspectManifest,
}) => {
  const validatedPlan = validatePlan(plan, version);
  const verified = [];
  const failed = [];

  for (const item of validatedPlan) {
    try {
      const digest = await inspectManifest(item.image, version, {
        allowMissing: true,
      });
      if (digest !== item.source_digest) {
        failed.push(item.image);
        continue;
      }

      verified.push({ digest, image: item.image });
    } catch {
      failed.push(item.image);
    }
  }

  return { failed, verified };
};

const safeVersion = (primary, fallback) => {
  for (const value of [primary, fallback]) {
    try {
      return validateVersion(value);
    } catch {
      // Invalid user input is never copied into a Markdown summary.
    }
  }

  return 'invalid';
};

export const buildSummary = ({
  finalStatus,
  inventory,
  preflightVersion,
  privateIdentity,
  publicReleaseUrl,
  requestedVersion,
  verifiedImages,
}) => {
  const version = safeVersion(preflightVersion, requestedVersion);
  const images = validateInventory(inventory);
  const expectedUrl =
    version === 'invalid'
      ? null
      : `https://github.com/${PUBLIC_REPOSITORY}/releases/tag/${version}`;
  const safePublicUrl =
    publicReleaseUrl === expectedUrl ? publicReleaseUrl : 'not verified';
  const escapedVersion =
    version === 'invalid' ? null : version.replace(/\./g, '\\.');
  const identityPattern = escapedVersion
    ? new RegExp(`^${escapedVersion}@[a-f0-9]{40}$`)
    : null;
  const safeIdentity =
    identityPattern && identityPattern.test(privateIdentity || '')
      ? privateIdentity
      : 'not verified';
  const verifiedByImage = new Map();

  if (Array.isArray(verifiedImages)) {
    for (const item of verifiedImages) {
      if (
        images.includes(item?.image) &&
        DIGEST_PATTERN.test(item?.digest || '')
      ) {
        verifiedByImage.set(item.image, item.digest);
      }
    }
  }

  const lines = [
    '# Private release result',
    '',
    `- Version: \`${version}\``,
    `- Public release URL: ${
      safePublicUrl === 'not verified'
        ? safePublicUrl
        : `[${safePublicUrl}](${safePublicUrl})`
    }`,
    `- Private commit/tag identity: \`${safeIdentity}\``,
    `- Expected image count: ${images.length}`,
    `- Verified image count: ${verifiedByImage.size}`,
    '',
    '| Image repository | Resulting manifest digest |',
    '| --- | --- |',
    ...images.map(
      (image) =>
        `| \`${image}\` | \`${
          verifiedByImage.get(image) || 'not verified'
        }\` |`,
    ),
    '',
    `- Final status: **${finalStatus === 'PASS' ? 'PASS' : 'FAIL'}**`,
    '',
  ];

  return lines.join('\n');
};

const writeOutput = (name, value) => {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) {
    throw new ContractError('GitHub output file is unavailable.');
  }

  const rendered = String(value);
  if (rendered.includes('\n') || rendered.includes('\r')) {
    throw new ContractError('Refusing to write a multiline GitHub output.');
  }

  appendFileSync(outputFile, `${name}=${rendered}\n`);
};

const verifyRepository = async () => {
  const inventory = loadInventory();
  validateInventoryCoverage(inventory, discoverPublishedImages());

  const releaseConfig = readJson(
    path.join(ROOT, '.release-it.json'),
    'release-it configuration',
  );
  if (
    releaseConfig.increment !== false ||
    releaseConfig.git?.pushRepo !== 'origin' ||
    releaseConfig.git?.requireBranch !== 'main' ||
    releaseConfig.plugins?.['@release-it/conventional-changelog']?.context
      ?.repository !== 'erxes-private'
  ) {
    throw new ContractError(
      'release-it is not pinned to the private exact-version contract.',
    );
  }

  const packageJson = readJson(
    path.join(ROOT, 'package.json'),
    'Root package metadata',
  );
  if (
    packageJson.scripts?.release !== 'node scripts/release/release-private.mjs'
  ) {
    throw new ContractError(
      'Root release command does not use the guarded wrapper.',
    );
  }

  const { parseDocument } = await import('yaml');
  const workflowDirectory = path.join(ROOT, '.github/workflows');
  for (const name of readdirSync(workflowDirectory).filter((item) =>
    /\.ya?ml$/.test(item),
  )) {
    const document = parseDocument(
      readFileSync(path.join(workflowDirectory, name), 'utf8'),
    );
    if (document.errors.length > 0) {
      throw new ContractError(`Workflow YAML is invalid: ${name}.`);
    }

    if (name === 'release.yml') {
      const workflow = document.toJS();
      for (const job of Object.values(workflow.jobs || {})) {
        for (const step of job.steps || []) {
          if (typeof step.run !== 'string') {
            continue;
          }

          const syntax = spawnSync('bash', ['-n'], {
            encoding: 'utf8',
            input: step.run,
            timeout: 10_000,
          });
          if (syntax.error || syntax.signal || syntax.status !== 0) {
            throw new ContractError(
              'Release workflow contains invalid shell syntax.',
            );
          }
        }
      }
    }
  }

  writeLine(`Release contract valid for ${inventory.length} images.`);
};

const runCli = async () => {
  const [command] = process.argv.slice(2);

  if (command === 'validate-repository') {
    await verifyRepository();
    return;
  }

  if (command === 'verify-metadata') {
    const version = validateVersion(process.env.REQUESTED_VERSION);
    const inventory = loadInventory();
    validateInventoryCoverage(inventory, discoverPublishedImages());
    const state = await verifyGitHubState({
      eventReleaseId: process.env.RELEASE_EVENT_ID,
      eventTag: process.env.RELEASE_EVENT_TAG,
      fetchImpl: fetch,
      token: process.env.GITHUB_TOKEN,
      version,
    });

    writeOutput('expected_count', inventory.length);
    writeOutput('private_identity', `${version}@${state.commit}`);
    writeOutput('public_release_url', state.publicRelease.url);
    writeOutput('version', version);
    writeLine(`Verified exact GitHub release state for ${version}.`);
    return;
  }

  if (command === 'verify-images') {
    const version = validateVersion(process.env.RELEASE_VERSION);
    const inventory = loadInventory();
    validateInventoryCoverage(inventory, discoverPublishedImages());
    const plan = await createImagePlan({
      images: inventory,
      inspectManifest: inspectDockerManifest,
      version,
    });
    writeOutput('plan_json', JSON.stringify(plan));
    writeLine(`Verified ${plan.length} source manifests for ${version}.`);
    return;
  }

  if (command === 'tag-image') {
    const image = validateImage(process.env.RELEASE_IMAGE);
    const result = tagImage({
      image,
      sourceDigest: process.env.SOURCE_DIGEST,
      version: process.env.RELEASE_VERSION,
    });
    writeLine(
      `${
        result === 'created' ? 'Created' : 'Preserved'
      } verified tag for ${image}.`,
    );
    return;
  }

  if (command === 'verify-tags') {
    const version = validateVersion(process.env.RELEASE_VERSION);
    const plan = parsePlan(process.env.RELEASE_PLAN_JSON, version);
    const result = await verifyVersionedImages({
      inspectManifest: inspectDockerManifest,
      plan,
      version,
    });
    writeOutput('verified_count', result.verified.length);
    writeOutput('verified_json', JSON.stringify(result.verified));

    if (result.failed.length > 0) {
      throw new ContractError(
        `Versioned manifest verification failed for: ${result.failed.join(
          ', ',
        )}.`,
      );
    }

    writeLine(
      `Verified all ${result.verified.length} versioned manifests for ${version}.`,
    );
    return;
  }

  if (command === 'summary') {
    const inventory = loadInventory();
    let verifiedImages = [];
    try {
      verifiedImages = JSON.parse(process.env.VERIFIED_IMAGES_JSON || '[]');
    } catch {
      verifiedImages = [];
    }

    const summary = buildSummary({
      finalStatus: process.env.FINAL_STATUS,
      inventory,
      preflightVersion: process.env.RELEASE_VERSION,
      privateIdentity: process.env.PRIVATE_IDENTITY,
      publicReleaseUrl: process.env.PUBLIC_RELEASE_URL,
      requestedVersion: process.env.REQUESTED_VERSION,
      verifiedImages,
    });

    if (!process.env.GITHUB_STEP_SUMMARY) {
      throw new ContractError('GitHub job summary file is unavailable.');
    }

    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
    return;
  }

  throw new ContractError('Unknown release contract command.');
};

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runCli().catch((error) => {
    const message =
      error instanceof ContractError
        ? error.message
        : 'Unexpected release contract validation failure.';
    process.stderr.write(`Release contract failed: ${message}\n`);
    process.exitCode = 1;
  });
}
