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

Record the source repository URL, commit SHA, and original relative path on the challenge `provenance` object (`repository`, `commit`, `original_path`).

Checksums may be generated for verification. Store them on `preservation.checksums` as `{path, algorithm, value}` and set `preservation.checksum_verified` when those digests have been checked. Checksums belong in metadata. Do not modify original files to add them.

## Exclusions

If a file cannot be included because of licensing, privacy, safety, size, or other constraints, append `{path, reason}` to `preservation.omissions`. If an archived file was changed, append `{path, reason}` to `preservation.modifications` and set `preservation.modified`. Do not silently omit or alter a file.
