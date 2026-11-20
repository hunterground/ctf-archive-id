# Data model

JSON Schemas in `schemas/` are the field contract. Templates in `templates/` are valid examples of those schemas. This document describes the entities and the fields whose meaning is easy to confuse. Property lists, enums, and required keys live in the schemas.

## Competition

A recurring event or competition series. Stored at `competitions/<competition-id>/competition.yaml`.

`status` is the event lifecycle: `active`, `inactive`, or `unknown`. `verification` is the quality of this archive record: `unverified`, `needs_scope_review`, `corroborated`, or `verified`. An active competition can still be unverified.

`organizer` is an object with `name` and `website`. The competition's own site stays in `website`.

## Edition

A particular year or instance of a competition. Stored in a four-digit year directory and described by `edition.yaml`.

`status` is the edition lifecycle: `planned`, `ongoing`, `completed`, `cancelled`, or `unknown`. `verification` uses the same record-quality values as a competition.

Do not invent an edition year. If the year is unknown, stop and ask. Do not create a non-year directory, and do not infer a year from neighboring editions.

Counts live under `statistics`. `challenge_materials_imported` records whether challenge files for that edition have been copied into this archive.

## Division (optional)

A real event division, track, or participant group that affects how the event is organized. Only create a division when the event actually has one. Do not invent a default division.

When a division exists, store `divisions/<division-id>/division.yaml`. The schema is `schemas/division.schema.json`.

## Round

A stage of an edition or division, such as qualification or final. Each round has a `round.yaml` file.

`type` is the stage: `qualification`, `preliminary`, `semifinal`, `final`, `warmup`, `practice`, or `other`. Online or onsite delivery is `delivery` (`online`, `onsite`, `hybrid`, `unknown`, or `null`), not a round type.

A single-stage event that has no qualifier or final uses round id `main` and `type: other`. Do not invent a `final` round for that case.

`verification` is record quality. Counts live under `statistics`.

## Category

A grouping used by the competition to classify challenges (for example `web`, `pwn`, `rev`, `crypto`). Category is represented by a directory, not a separate metadata entity.

The normalized directory name is stored as `category` in `challenge.yaml`. The original source label is stored as `original_category`. The challenge directory name is `slug`.

## Challenge

A single challenge and its metadata. Each challenge directory contains:

- `challenge.yaml` — archive metadata;
- `original/` — original challenge distribution, with its internal structure preserved.

A metadata-only record should be exceptional and explicitly documented in `notes`; it must not be presented as a complete archived challenge.

Authors are a list of `{name, team}` objects under `authors`. Record an author or team only when the source supports it. `difficulty` is `{value, source}`. `source` is `organizer`, `archive_curator`, or `unknown`. A curator-assigned score must use `archive_curator` and is not an organizer fact. Unknown difficulty is `{value: null, source: unknown}`.

Provenance uses `provenance` (`archive_id`, `source_type`, `repository`, `commit`, `original_path`). Licensing uses `declared_license`, `redistribution` (`permitted`, `prohibited`, or `unknown`), `attribution_required`, `attribution`, and the optional evidence fields `copyright_holder` and `permission_reference`.

`verification` is record quality, separate from any competition or edition lifecycle `status`.

## Archive source

An upstream repository, website, or downloadable archive that provides source material. One item matches `schemas/archive.schema.json`. The registry document `archives/repositories.yaml` matches `schemas/registry.schema.json` and holds those items under `repositories`.

A registry entry is not proof that its contents may be redistributed. Its `verification` object (`status`, `last_checked`) is source-check state, not the record-quality `verification` used on competitions and challenges.

## Candidate

An unresolved event lead in `research/candidates.yaml`, validated by `schemas/candidate.schema.json`. Candidate `status` is `needs_scope_review` or `excluded_pending_evidence`. That vocabulary is not competition `verification`.

## References

`references` entries are objects: `title`, `url`, `type`, and `accessed`. `type` is `official_website`, `organizer_announcement`, `official_repository`, `third_party_archive`, `writeup`, or `other`.

## Identifiers

IDs are stable machine identifiers, not necessarily public names. IDs must be unique within their entity type. Paths and IDs should not be changed casually after publication.

Every record has `schema_version` `"1.0"`. Quote it in YAML so it stays a string.

## Unknown data

Use YAML `null` for unknown scalar values. Use the documented `unknown` enum for fields where the schema defines it. Do not guess. Do not use an empty string as a placeholder.
