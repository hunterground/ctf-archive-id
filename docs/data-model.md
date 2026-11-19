# Data model

## Competition

A recurring event or competition series. Stored at `competitions/<competition-id>/competition.yaml`.

## Edition

A particular year or instance of a competition. Stored in a four-digit year directory and described by `edition.yaml`.

## Division (optional)

A real event division, track, or participant group that affects how the event is organized. Only create a division when the event actually has one. Do not invent a default division.

## Round

A stage of an edition or division, such as qualification or final. Each round has a `round.yaml` file.

## Category

A grouping used by the competition to classify challenges (for example `web`, `pwn`, `rev`, `crypto`). Category is represented by a directory, not a separate metadata entity in the initial model.

The normalized directory name is stored as `category` in `challenge.yaml`; the original source label is stored as `original_category`.

## Challenge

A single challenge and its metadata. Each challenge directory contains:

- `challenge.yaml` — archive metadata;
- `original/` — original challenge distribution, with its internal structure preserved.

A metadata-only record should be exceptional and explicitly documented; it must not be presented as a complete archived challenge.

## Archive source

An upstream repository, website, or downloadable archive that provides source material. Registry entries in `archives/repositories.yaml` help track source repositories that may contain multiple competitions or editions.

## Identifiers

IDs are stable machine identifiers, not necessarily public names. IDs must be unique within their entity type. Paths and IDs should not be changed casually after publication.

## Unknown data

Use YAML `null` for unknown scalar values. Use the documented `unknown` enum for fields where the schema defines it. Do not guess.
