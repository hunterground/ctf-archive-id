# Naming conventions

## Directory hierarchy

Without divisions:

```text
competitions/<competition-id>/<year>/rounds/<round-id>/<category>/<slug>/
```

With divisions:

```text
competitions/<competition-id>/<year>/divisions/<division-id>/rounds/<round-id>/<category>/<slug>/
```

## IDs and slugs

- Use lowercase kebab-case.
- Competition IDs should be short and stable.
- Edition directories use a four-digit year.
- Round and division IDs should be based on official names where possible.
- The challenge directory name is the `slug`, such as `001-baby-shark`. The sequence is the numeric prefix of that slug. Do not write the sequence a second time in the path.
- Sequence numbers are unique within a category in a round. They may repeat in another category or round.
- Preserve the original display name in `name`. A distinct source spelling may also be stored in `original_name`.

## Round IDs

Common round IDs include `qualification`, `final`, `semifinal`, `preliminary`, `warmup`, `practice`, and `other`. Add a new lowercase kebab-case id when the event uses a distinct stage not represented here. `type` stays one of the values in `schemas/round.schema.json`; use `other` when none of those names fit the new id.

A single-stage event with no qualifier or final uses round id `main` and `type: other`. Online or onsite participation is `delivery`, not the round id.

## Category directories

Preferred conventional names:

`web`, `pwn`, `rev`, `crypto`, `forensics`, `misc`, `osint`, `mobile`, `hardware`, `blockchain`, `programming`.

The list is not exhaustive. Use `uncategorized` only when the original category is absent or cannot be reliably determined. Preserve the exact original category wording in `original_category`.

## Challenge IDs

A readable pattern is:

`<competition-id>-<year>[-<division-id>]-<round-id>-<category>-<sequence>`

Example: `compfest-2024-qualification-web-001`.

IDs must remain stable even if the display name changes. Check for collisions before assigning an ID.
