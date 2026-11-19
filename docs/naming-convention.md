# Naming conventions

## Directory hierarchy

Without divisions:

```text
competitions/<competition-id>/<year>/rounds/<round-id>/<category>/<sequence>-<slug>/
```

With divisions:

```text
competitions/<competition-id>/<year>/divisions/<division-id>/rounds/<round-id>/<category>/<sequence>-<slug>/
```

## IDs and slugs

- Use lowercase kebab-case.
- Competition IDs should be short and stable.
- Edition directories use a four-digit year.
- Round and division IDs should be based on official names where possible.
- Challenge directory names use a zero-padded sequence and normalized slug, such as `001-baby-shark`.
- Sequence numbers are unique within a category in a round. They may repeat in another category or round.
- Preserve the original display name in metadata.

## Round IDs

Common round IDs include `qualification`, `final`, `semifinal`, `preliminary`, `warmup`, `practice`, and `other`. Add a new lowercase kebab-case ID when the event uses a distinct stage not represented here.

## Category directories

Preferred conventional names:

`web`, `pwn`, `rev`, `crypto`, `forensics`, `misc`, `osint`, `mobile`, `hardware`, `blockchain`, `programming`.

The list is not exhaustive. Use `uncategorized` only when the original category is absent or cannot be reliably determined. Preserve the exact original category wording in `original_category`.

## Challenge IDs

A readable pattern is:

`<competition-id>-<year>[-<division-id>]-<round-id>-<category>-<sequence>`

Example: `compfest-2024-qualification-web-001`.

IDs must remain stable even if the display name changes. Check for collisions before assigning an ID.
