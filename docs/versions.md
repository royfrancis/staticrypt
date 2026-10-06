# Versions

A summary of changes in recent StatiCrypt releases.

## 3.5.6 — 2026-10-06

- Fixed a template-injection bug where special characters (e.g. a `"`) in custom `--template-*` text could break the generated password page's inline script; plain-text fields are now safely HTML-escaped and rich-text fields (subtitle, footer, instructions) are safely JSON-embedded.
- Fixed a bug where a bad or stale share-link/remember-me hash could leave the password page stuck on the loading spinner instead of falling back to the password form.
- Fixed `--decrypt` writing decrypted HTML and copied non-HTML files to two different output directories when `--directory` wasn't explicitly set.
- Fixed `--decrypt` silently reporting full success (and exiting `0`) even when some or all files failed to decrypt; failures are now counted and reflected in a non-zero exit code.
- Fixed a crash when every file in a `--decrypt` batch failed and the output directory was never created.
- Fixed `--flag=value` (equals-form) CLI arguments being silently ignored for `--share` and `--directory`.
- Fixed an internal error-handling bug that threw an unrelated error instead of a clean message on a failed file copy.
- Fixed a config-file salt not being lowercased consistently with a CLI-supplied salt.
- Hardened the Docker image to run as a non-root `node` user, and documented the `--user $(id -u):$(id -g)` flag needed when mounting a host directory so the container can write to it.
- Switched GitHub Actions workflows to use the default `GITHUB_TOKEN` instead of a custom secret.
- Removed the unused `scripts/` build/demo tooling and other leftover files no longer referenced by the project.
- Added GitHub Actions usage examples to the documentation.
- Added and expanded the automated test suite to cover the fixes above.
- Added versions page to documentation site

## 3.5.5 — 2026-01-14

- Added support for a custom brand/hero image on the password page, with configurable position, size, and focus options.
- Added footer text and footer link options for the password page.
- Switched the primary container registry from Docker Hub to GitHub Container Registry (GHCR), while continuing to publish a Docker Hub build.
- Added `-h` as an alias for `--help`.
- Added a recursive-encryption usage example and fixed broken documentation badge links.
- General documentation updates.

## 3.5.4 — 2025-12-06

- Added the VitePress-based documentation site, replacing the previous single-README documentation.
- Added the Jest test suite and dropped the Husky dependency.
- Reorganized the Dockerfile into its own directory and streamlined the multi-platform Docker build and tagging workflow.
- Added subtitle, subtitle link, and page title customization options, and a password show/hide toggle, to the password page; improved page styling and responsiveness.
- Added support for customizing the "remember me" storage namespace.
- Added success/failure summary messages after encryption and decryption, plus a `--quiet` flag to suppress them.
- Added error handling for missing input paths and automatic config directory creation.
- Added support for `.htm` files alongside `.html`.
- Various smaller fixes and polish (typos, demo page links, background pattern, logo).
