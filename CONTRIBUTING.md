# Contributing

Thank you for helping preserve Indonesian CTF history.

## Before contributing

- Read [docs/preservation-policy.md](docs/preservation-policy.md).
- Read [docs/licensing-policy.md](docs/licensing-policy.md).
- Follow [docs/naming-convention.md](docs/naming-convention.md).
- Use the metadata templates in `templates/`.
- If using an AI coding agent, follow the repository instructions in `AGENTS.md`.

## Adding a competition

1. Confirm that the competition is in scope: it must be organized by an Indonesian entity.
2. Create `competitions/<competition-id>/competition.yaml`.
3. Add one directory per known edition, using the four-digit year as the directory name.
4. Add `edition.yaml` and the appropriate round/division structure.
5. Record sources and uncertainty. Use YAML `null` for unknown values rather than guessing.

## Adding challenge materials

1. Confirm that the source files may be redistributed into this repository. If permission is unclear, add source/provenance information to the archive registry and open an issue instead of copying the files.
2. Create the challenge directory under the appropriate round and category.
3. Put the original files inside `original/`.
4. Preserve the original internal directory structure and filenames.
5. Add `challenge.yaml` using `templates/challenge.yaml`.
6. Record `provenance` (repository, commit, and original path), `authors`, `declared_license`, `redistribution`, and `verification` when known.
7. Do not remove files merely because they appear unnecessary. Record exclusions in `preservation.omissions` when a file cannot or should not be archived.

## Metadata quality

- IDs must be stable and unique within their entity type.
- Use ISO 8601 dates (`YYYY-MM-DD`) when the exact date is known.
- Use `null` for unknown scalar values.
- Preserve the source's original category in `original_category`. The challenge directory name is `slug`.
- Do not infer authorship, difficulty, flags, or licensing. Record people in `authors`. If a curator assigns difficulty, set `difficulty.source` to `archive_curator`.
- Set `verification` for record quality. Use `status` only for the lifecycle values defined on competitions and editions.
- Keep metadata factual and traceable to references.

## Pull requests

A pull request should explain:

- Which competition and edition are being added or changed.
- Where the materials came from.
- Whether redistribution is authorized and how that was established.
- Any files intentionally omitted or transformed.
- Which validation steps were run.

Do not include secrets, live flags, private credentials, personal data, or unrelated exploit artifacts.
