# Contribution guide

1. Check that the competition is organized by an Indonesian entity.
2. Search the existing archive for duplicate competition, edition, or challenge records.
3. Establish the source and redistribution status before copying challenge materials.
4. Create metadata from the templates. Set `verification` from the evidence (`unverified`, `needs_scope_review`, `corroborated`, or `verified`). Keep lifecycle `status` separate from `verification`.
5. Preserve original challenge files under `original/`.
6. Validate paths, IDs, metadata, attribution, and provenance against the JSON Schemas. Record authors in `authors` only when the source supports them. A curator-assigned difficulty must set `difficulty.source` to `archive_curator`.
7. Submit a pull request with a source and licensing summary.

For AI-assisted bulk migrations, follow the root [AGENTS.md](../AGENTS.md). Prefer a dry-run inventory and mapping proposal before importing files.
