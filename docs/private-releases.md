# Private release following

`erxes/erxes` is the sole production version authority. `erxes-private` never
calculates its own next version: an operator supplies the exact stable `3.x.y`
version of an already-published public GitHub Release.

## Release-supported private images

The reviewed inventory is `.github/release-images.json`. It contains all 14
Docker repositories published as `latest` by the private `ci-api-*` and
`ci-saas-migrations` workflows. The migrations image is included because it is
the production one-off Kubernetes Job runtime. The `ci-ui-*` workflows do not
publish Docker images, so there are no CI-built images intentionally excluded
from the release.

`latest` is only the mutable source alias inspected by the release workflow.
The immutable deployment result is the exact release version tag.

Future changelog links are explicitly pinned to `erxes/erxes-private`. The root
package metadata has no repository URL, so the conventional-changelog library
otherwise falls back to the operator's local `origin`; that unpinned fallback
produced the existing public `erxes/erxes` links. Historical changelog text is
left intact.

## Operator procedure

1. Confirm the public `erxes/erxes` release exists, is published, and is neither
   a draft nor a prerelease.
2. Review the private commit that should follow that public version. Confirm all
   release-supported private `latest` images represent the intended release.
3. From a clean `main` branch whose `origin` is `erxes/erxes-private`, run:

   ```bash
   pnpm release -- 3.0.92
   ```

   Replace `3.0.92` with the exact reviewed public version. The wrapper rejects
   aliases, prefixes, prereleases, metadata, whitespace, malformed values, and
   additional arguments. It verifies the public release before invoking
   `release-it` with that exact version. `release-it` keeps the private
   changelog, creates the private version commit and exact tag, pushes them, and
   publishes the matching private GitHub Release.

4. Publishing the private release starts `.github/workflows/release.yml`. Do
   not deploy until its final summary is `PASS` with all expected images
   verified.

The manual workflow input is repair-only. It accepts the same strict version,
but preflight requires the exact private Git tag, published private release,
tagged `package.json` version, and public release to already exist. It cannot
mint an arbitrary Docker version.

## Fail-closed behavior and reruns

Preflight completes before any version tag is written. It verifies the public
and private GitHub state, resolves the private tag to one commit, verifies the
tagged package version, authenticates to Docker Hub, checks inventory coverage,
and records every required `latest` digest. A missing source or conflicting
existing version digest stops the whole release before tagging.

Each tagging job rechecks that `latest` still has the preflight digest, preserves
an already-correct version tag, or creates the exact version tag from the
digest-pinned source. It never falls back to another tag. The final job verifies
every versioned manifest against the preflight plan. A rerun is idempotent while
the intended `latest` manifests are unchanged; if `latest` has moved or any
version tag conflicts, the repair fails instead of overwriting silently.

## First synchronized release

No `3.0.90` or `3.0.91` private releases should be backfilled. The first
synchronized version remains a human release decision. The recommended choice
is `3.0.92`, the current published public release, after maintainers explicitly
confirm the private commit and all 14 source manifests are the intended pair.
If that review cannot be completed confidently, wait for the next public
release and synchronize there instead; never move or replace an existing tag.
