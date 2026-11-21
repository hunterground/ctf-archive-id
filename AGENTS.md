# AGENTS.md — Indonesian CTF Archive

Instructions for AI coding agents and automated assistants working in this repository, especially when migrating one or more existing CTF repositories into this archive.

## 1. Mission

Migrate and maintain historical CTF competition records and challenge materials in a consistent, traceable, preservation-first structure.

This repository is an archive, not a platform-specific challenge runtime. Do not convert challenges into HunterGround format, build container images, rewrite challenge source code, or "repair" challenge files as part of archival migration unless the user explicitly requests a separate conversion task.

The repository itself is the source of truth for archived content and metadata.

## 2. Non-negotiable rules

1. **Preserve source materials.** Copy original challenge files into the challenge's `original/` directory and preserve their internal directory structure and filenames. Move author solver scripts to `solvers/` as described in Phase D, without rewriting the remaining files.
2. **Do not silently modify originals.** Do not rename, reformat, patch, sanitize, rebuild, or delete original challenge files. If a safety or legal concern prevents copying a file, record the omission and its reason in migration notes.
3. **Do not invent facts.** Never guess competition dates, authors, teams, challenge names, categories, difficulty, flags, licenses, or redistribution permissions.
4. **Unknown means `null` or an explicit unknown enum.** Do not use fabricated placeholders as factual metadata.
5. **Preserve provenance.** Record the upstream repository URL, commit SHA, and original relative path on the challenge `provenance` object.
6. **Public does not mean redistributable.** A public Git repository is not, by itself, evidence of a license or permission to republish its contents.
7. **No blanket license assumption.** Determine licensing per challenge and preserve original license/notice files.
8. **Keep category organization.** Every challenge directory belongs under a category directory. Use `uncategorized/` only when the source does not provide a category and there is insufficient evidence to classify it.
9. **Do not flatten source folders.** Preserve nested directories under `original/`.
10. **Avoid destructive operations.** Never overwrite existing archive records or challenge material without inspecting the current content and obtaining explicit user approval.
11. **Keep this archive platform-neutral.** Do not add platform runtime files, deployment manifests, generated challenge instances, or platform-specific metadata unless explicitly requested.
12. **Report uncertainty and omissions.** Provide a migration report listing unresolved facts, skipped files, duplicate candidates, and licensing concerns.

## 3. Expected archive structure

### Competition without divisions

```text
competitions/<competition-id>/
├── competition.yaml
└── <year>/
    ├── edition.yaml
    └── rounds/
        └── <round-id>/
            ├── round.yaml
            └── <category>/
                └── <slug>/
                    ├── challenge.yaml
                    └── original/
```

### Competition with divisions

```text
competitions/<competition-id>/
├── competition.yaml
└── <year>/
    ├── edition.yaml
    └── divisions/
        └── <division-id>/
            ├── division.yaml
            └── rounds/
                └── <round-id>/
                    ├── round.yaml
                    └── <category>/
                        └── <slug>/
                            ├── challenge.yaml
                            └── original/
```

Use `rounds/` directly under the edition when no real division structure exists. Do not create an artificial `general`, `open`, or `default` division.

Solver scripts live outside the challenge distribution. Mirror the challenge directory under `solvers/` and keep the path the file had under `original/`:

```text
solvers/competitions/<competition-id>/<year>/.../<slug>/<path-under-original>
```

A division edition uses the same `divisions/<division-id>/rounds/...` path it uses under `competitions/`.

## 4. Migration workflow

Perform migration in phases. Do not start copying files before the source has been inventoried and its structure understood.

### Phase A — Inspect and inventory

1. Inspect the source repository's README, documentation, directory tree, manifests, and Git history where available.
2. Identify:
   - competition name and organizer;
   - edition/year;
   - event divisions, if any;
   - rounds (qualification, final, semifinal, etc.);
   - challenge directories and original category labels;
   - challenge names, authors, teams, descriptions, and difficulty when explicitly available;
   - source URL, branch/tag, commit SHA, and original relative paths;
   - license files, per-directory notices, and redistribution statements.
3. Distinguish challenge source material from repository tooling, writeups, deployment infrastructure, event website assets, and unrelated files.
4. Produce an inventory before importing. The inventory should include at least:
   - source path;
   - inferred competition/edition/round/division/category;
   - proposed archive path;
   - files and total size;
   - metadata evidence;
   - licensing/redistribution status;
   - confidence or unresolved questions.
5. Do not treat a directory name as conclusive evidence if README or metadata contradicts it.

If the source repository contains multiple competitions or editions, separate them into the appropriate archive entities. Do not assume one repository equals one competition.

### Phase B — Resolve the archive mapping

1. Determine whether the edition has divisions. Use divisions only when the event actually separated participants or challenge tracks into divisions.
2. Determine the round structure from source documentation. If the event has a distinct stage, use that stage. If it is a single-stage event with no qualifier or final, use round id `main` and `type: other`. If it is unclear whether a separate stage existed, stop and ask the user. Do not invent a `final` round.
3. Map each challenge to a category:
   - Prefer the source's category label.
   - Normalize common aliases to the archive directory vocabulary (see Section 5).
   - Preserve the exact source label in `original_category`.
   - Use `uncategorized/` if the category is absent or cannot be reliably determined.
4. Propose stable IDs and paths. Check for collisions with existing records.
5. Prepare a mapping table from source paths to proposed archive paths.
6. Present material licensing/permission ambiguities before copying. Do not resolve them by assumption.

### Phase C — Create metadata

Use the templates in `templates/` and follow `docs/data-model.md`.

Create or update:
- `competition.yaml` once per competition;
- `edition.yaml` once per edition;
- `division.yaml` once per real division;
- `round.yaml` once per round;
- `challenge.yaml` once per challenge.

Metadata requirements:

- Keep `name` as the original display name where known.
- Use normalized `id` and `slug` for archive identifiers and paths. `slug` is the challenge directory name.
- Store source category wording in `original_category`.
- Store authors and teams in `authors` only when supported by source evidence.
- Record `provenance`: upstream repository URL, commit, and original path. `source_type` is `git`, `website`, `download`, `manual`, or `unknown`.
- Record licensing fields truthfully. `redistribution` is `permitted`, `prohibited`, or `unknown`. Use `unknown` when unclear.
- Set `verification` (`unverified`, `needs_scope_review`, `corroborated`, or `verified`) separately from competition and edition lifecycle `status`.
- Difficulty is `{value, source}`. Use `archive_curator` when a curator assigns the score. Use `{value: null, source: unknown}` when difficulty is not stated.
- Add `references` objects (`title`, `url`, `type`, `accessed`) when useful.
- Do not copy challenge flags, secrets, private keys, or credentials into metadata.

Do not create an edition merely because a competition is believed to be recurring.

Do not infer missing edition years from neighboring years.

Use `null` for unknown dates, statistics, organizer information, and other unknown values.

Preserve the official event name when it is established. Do not replace it with a guessed or normalized name.

### Phase D — Copy original materials

1. Copy the challenge's source files into `original/`.
2. Preserve all relative paths and filenames below the challenge root.
3. Move solver material out of `original/` into `solvers/`, keeping the path relative to the challenge directory. Solver material is a directory named `solver`, `solvers`, `solve`, `solution`, or `solutions`, including its contents, and a file whose name is a solver script (`solve.*`, `solver.*`, `solv.*`, `sol.*`, `exploit.*`, `solver_*`, `solve_*`, or `exploit_*`) when it is not already inside one of those directories. Do not edit the remaining original files to retarget links. Do not record the move in `challenge.yaml`, including `preservation.omissions`. Remove checksum entries for those paths. Leave `preservation.modified` false.
4. Do not include `.git/`, caches, virtual environments, editor settings, or generated build output unless the item is itself part of the challenge distribution.
5. Do not include repository-wide tooling in every challenge.
6. Do not omit Dockerfiles, compose files, scripts, attachments, or challenge-provided configuration merely because they are not directly executable; they may be part of the original distribution. This does not apply to solver material moved in step 3.
7. Preserve license and notice files at the most specific applicable level. A repository-level license may not necessarily apply to every challenge; record the scope carefully.
8. If a challenge is represented only by a link and redistribution is not established, do not copy it. Register the source in `archives/repositories.yaml` and document the reason.

When the upstream source is a Git repository, record the exact commit SHA used whenever possible. A branch name alone is not an immutable provenance reference.

### Phase E — Validate

Before declaring migration complete:

1. Check that each challenge directory contains `challenge.yaml` and `original/` (unless it is explicitly a metadata-only record, which must be clearly documented and approved).
2. Check that every challenge is nested under a category directory.
3. Check that metadata IDs and directory names are consistent.
4. Check that referenced competition, edition, round, and division identifiers match the hierarchy.
5. Check for duplicate challenge imports using names, source paths, hashes, and Git history where available.
6. Check that original file paths and file counts match the source inventory. Solver material is the exception: it must be under `solvers/` at the mirrored challenge path, and `challenge.yaml` must not mention that move.
7. Generate checksums for copied files in the migration report when practical. Do not modify source files to add checksums.
8. Validate YAML against the JSON Schemas when a validator is available. If not available, report that schema validation was not run.
9. Review licensing and attribution status for every challenge.
10. Review the final diff for accidental changes outside the intended archive paths.

Do not claim validation passed if a check was not actually performed.

### Phase F — Report

Provide a concise migration summary containing:

- competition(s), edition(s), round(s), and challenge count imported;
- category counts;
- source repository URL and commit SHA;
- archive paths created;
- files excluded and reasons;
- licensing/redistribution status, including unresolved items;
- duplicate candidates;
- validation performed and results;
- questions requiring human review.

Do not mark a challenge as redistributable unless permission is supported by a license or explicit authorization.

## 5. Category normalization

Use these canonical directory names when applicable:

| Canonical directory | Common source labels / meaning |
|---|---|
| `web` | Web, Web Exploitation, Web Security |
| `pwn` | Pwn, Binary Exploitation, Exploit |
| `rev` | Rev, Reverse, Reverse Engineering |
| `crypto` | Crypto, Cryptography |
| `forensics` | Forensics, Digital Forensics |
| `misc` | Misc, Miscellaneous |
| `osint` | OSINT, Open Source Intelligence |
| `mobile` | Mobile, Android, iOS |
| `hardware` | Hardware, IoT, Embedded |
| `blockchain` | Blockchain, Smart Contract |
| `programming` | Programming, PPC, Coding |
| `uncategorized` | No source category and no reliable classification |

This list is extensible. If the source has a legitimate category not listed here, use a normalized lowercase kebab-case directory name rather than forcing it into `misc`.

Do not confuse a challenge's technique with its event category. For example, a web challenge that uses cryptography remains in `web` if that is how the competition categorized it.

## 6. Naming rules

- Competition IDs: lowercase kebab-case, stable over time.
- Edition directory: four-digit year, e.g. `2024`.
- Division IDs: lowercase kebab-case, based on the official division name.
- Round IDs: lowercase kebab-case. See `docs/naming-convention.md` for the common ids, `main`, and the separate `type` field.
- Category directory: canonical short name or lowercase kebab-case for a new category.
- Challenge directory: the `slug`, such as `001-baby-shark`. Do not add a second sequence prefix.
- Sequence numbers are unique within a category directory in a given round, not globally across the round.
- Keep the original challenge name in `challenge.yaml`; never replace it with the slug.

Challenge IDs must be stable and unique. Use a readable composition such as:

`<competition-id>-<year>[-<division-id>]-<round-id>-<category>-<sequence>`

If the resulting ID is too long or a collision occurs, use a stable, documented alternative. Do not derive identity solely from a mutable display name.

## 7. Licensing and rights

Use the following values for `licensing.redistribution`:

- `permitted`: an applicable license or explicit authorization permits redistribution;
- `prohibited`: a license or rights holder explicitly prohibits redistribution;
- `unknown`: status has not been established.

A missing license is `unknown`, not `permitted`.

Preserve applicable license/notice files in the archive. Do not apply the repository's own project license to archived challenge materials. If a source repository has a license, determine whether it clearly covers the challenge directory before relying on it.

For `declared_license`, record the license identifier or source wording only when known. Do not infer SPDX identifiers from vague statements.

## 8. Existing archive safety

Before editing an existing archive record:

1. Read the current metadata and inspect all existing files.
2. Check whether the proposed challenge already exists under another path.
3. Preserve stable IDs and existing provenance.
4. Do not replace an existing `original/` tree without explicit approval.
5. If correcting metadata, make the smallest factual change and cite its evidence in the migration notes or pull request.

## 9. Expected migration deliverables

For each migration task, produce:

- an inventory/mapping report before import;
- the new or updated archive directories and YAML metadata;
- original challenge files, where redistribution is established;
- source repository records in `archives/repositories.yaml` where useful;
- a post-migration validation report;
- a list of unresolved legal, attribution, classification, or provenance questions.

If the user asks for a dry run, do not copy or modify archive files. Return only the inventory, mapping proposal, and issues.

## 10. Competition discovery and metadata maintenance

The canonical competition metadata lives in:

- `competitions/<competition-id>/competition.yaml`
- `competitions/<competition-id>/<year>/edition.yaml`

Generated indexes live in `index/` and are described in `index/README.md`. Do not treat them as the source of truth. Do not invent index filenames before a generator exists.

#### A. Competition Scope

This archive focuses on competitions organized by Indonesian organizations or communities.

Do not include an event solely because:

- it was held in Indonesia;
- Indonesian teams participated;
- an Indonesian participant wrote a solution;
- a third-party repository contains its writeups.

Verify the organizing entity and event identity.

#### B. Candidate Records

Unresolved event leads belong in `research/candidates.yaml`.

Promote a candidate to `competitions/` only after checking 

1. Exact event identity.
2. Organizer identity.
3. Indonesian-organizer scope.
4. Whether the event included a CTF.
5. Edition-specific evidence.

If two names may refer to the same event, do not merge them without evidence.

#### C. Index Maintenance

Whenever canonical competition or edition metadata changes:

1. Update the relevant YAML records.
2. Regenerate the indexes under `index/` when a generator exists, including source indexes when sources changed.
3. Check that all referenced source IDs exist.
4. Check that all edition records point to a valid competition ID.
5. Check that index entries match canonical YAML metadata.

## 11. Stop and ask the user when

Stop rather than guessing when:

- it is unclear which competition or edition a source belongs to;
- source layout mixes multiple rounds or divisions without reliable evidence;
- redistribution permission is unclear and the requested task involves copying files;
- an existing archive record would be overwritten or materially changed;
- challenge identity is ambiguous or duplicate candidates cannot be resolved;
- source material appears to contain credentials, private data, or other sensitive information;
- the requested migration would require modifying original challenge files.

When possible, continue with unrelated, clearly authorized records and list the blocked items separately.

