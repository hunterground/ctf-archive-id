# Indonesia CTF Archive

A community-driven archive of Capture the Flag (CTF) competitions organized in Indonesia.

## Overview

This archive aims to preserve challenge materials and competition context while providing consistent metadata for discovery, research, and future conversion into learning platforms (HunterGround).

The project collects challenge materials from publicly available sources and authorized contributions, preserving their original content and structure while providing standardized metadata for discovery and research.

## Scope

This repository focuses on competitions organized by Indonesian entities, regardless of whether an event was held online or in person, or inside or outside Indonesia.

It includes:

- National and university CTF competitions
- Community-organized competitions
- Government and institutional competitions
- Historical and contemporary competition editions
- Qualification, final, and other competition rounds

An international competition hosted Indonesia is not automatically in scope if it was not organized by Indonesian entity.

## Repository Structure

```text
competitions/  Competition metadata and challenge archives
archives/      External archive source references
schemas/       JSON Schema definitions
templates/     Metadata templates
index/         Generated machine-readable indexes
docs/          Project documentation
tools/         Archive management utilities
AGENTS.md      Instructions for AI coding agents performing archive work
```

#### Organization model

Challenges are grouped by competition, edition, round, optional division, and category.

```text
competitions/<competition-id>/
└── <year>/
    ├── edition.yaml
    └── rounds/                         # Editions without divisions
        └── <round-id>/
            ├── round.yaml
            └── <category>/
                └── <sequence>-<slug>/
                    ├── challenge.yaml
                    └── original/
```

When an edition has actual divisions, use `divisions/<division-id>/rounds/` instead of `rounds/` directly under the edition. Do not create artificial `general` or `open` divisions.

See [docs/data-model.md](docs/data-model.md) and [docs/naming-convention.md](docs/naming-convention.md).

## Preservation Principles

1. Preserve original challenge files and their internal directory structure.
2. Normalize only the archive's outer directory names.
3. Retain original challenge names, category labels, filenames, and source provenance in metadata where known.
4. Do not modify upstream challenge files during archival.
5. Record licensing, attribution, and redistribution status per challenge.
6. Do not assume that public availability means permission to redistribute.
7. Keep this archive independent from any platform-specific challenge format.

## Licensing and Attribution

This repository contains materials created by different authors and organizations. The project documentation and metadata do not automatically share the same license as archived challenge content.

Each challenge must carry its own licensing and provenance information. Refer to [docs/licensing-policy.md](docs/licensing-policy.md) before adding or redistributing materials.

No blanket license is granted for all archived challenge files by this repository.

## Contributing

Contributions are welcome, including:

- Adding competitions and historical editions
- Discovering and documenting challenge repositories
- Preserving authorized challenge materials
- Improving metadata and archive accuracy
- Correcting provenance and attribution information

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## Project Status

This project is under initial development. Its metadata schemas, indexing conventions, and tooling may evolve as the archive grows.
