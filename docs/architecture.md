# Architecture

## Design goals

- Preserve actual challenge materials, not only links.
- Keep the archive independent of any CTF platform or runtime.
- Make the directory tree understandable without specialized tooling.
- Keep metadata machine-readable and stable.
- Preserve provenance and licensing information.
- Support competitions with and without divisions.

## Repository as source of truth

Competition records, metadata, and authorized challenge materials live in Git. The `index/` directory is intended for generated discovery indexes; generated indexes should be reproducible from source metadata and committed when the project adopts an index generator.

## Entity hierarchy

`Competition → Edition → Division (optional) → Round → Category → Challenge`

Category is a directory-level grouping within each round. The source's exact category label is retained in challenge metadata.

## External sources

`archives/repositories.yaml` records upstream repositories and archives. It is a source registry, not proof that the contents may be redistributed. Individual challenge records should retain their own provenance.
