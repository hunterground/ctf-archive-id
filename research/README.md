# Research Notes

This directory contains preliminary competition discoveries and unresolved leads.

It is not a list of fully verified competitions. `candidates.yaml` is validated by `schemas/candidate.schema.json`. Candidate `status` is `needs_scope_review` or `excluded_pending_evidence`, which is separate from competition `verification`. Optional `references` use the shared reference object.

## Workflow

1. Discover an event through public sources.
2. Identify the event's official organizer.
3. Confirm that the event included a CTF competition.
4. Find edition-specific evidence.
5. Record official websites and organizer references when available.
6. Record challenge repositories separately from writeup repositories.
7. Verify challenge authorship and redistribution rights before importing any challenge files.
8. Promote the candidate to `competitions/` when its identity and Indonesian-organizer scope are sufficiently established.

## Evidence Quality

Prefer sources in this order:

1. Official competition website.
2. Official organizer website or announcement.
3. Official competition repository.
4. Organizer-controlled social media or publication.
5. Participant repositories and writeups.
6. Third-party indexes and archive websites.

A participant writeup can help establish that an edition existed, but it does not independently establish organizer identity or permission to redistribute challenge materials.

## Unknown information

Use YAML `null` for unknown values.

Do not infer:

- organizer identity;
- event dates;
- challenge counts;
- participant counts;
- official websites;
- licenses;
- redistribution permissions;
- whether an event ran in an unlisted year.