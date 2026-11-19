# Preservation policy

## Goals

The archive aims to preserve challenge distributions as they were provided by their source, with sufficient provenance to identify and verify the origin.

## Original files

- Store challenge distribution files under `original/`.
- Preserve all paths and filenames within the challenge distribution.
- Do not rewrite line endings, reformat code, rename files, or patch vulnerabilities.
- Preserve challenge-provided Dockerfiles, compose files, scripts, binaries, attachments, and documentation when they are part of the distribution.
- Exclude repository metadata (`.git/`), caches, virtual environments, editor settings, and unrelated generated output unless they are intentionally part of the challenge.
- Preserve relevant license and notice files at their original applicable scope.

## Outer paths

The archive may normalize the outer directory names (competition, edition, division, round, category, and challenge folder) for consistency. Original challenge names and original category labels must remain in metadata.

## Provenance and integrity

Record the source repository URL, commit or release, and original relative path whenever possible. A commit SHA is preferred over a branch name.

Checksums may be generated for verification and migration reports. They must not require changing original files.

## Exclusions

If a file cannot be included because of licensing, privacy, safety, size, or other constraints, document the path and reason. Do not silently omit it.
