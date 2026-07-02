# Translation files

All user-facing copy lives here as plain JSON — no TypeScript edits required to change wording.

## Files

| File | Language |
|------|----------|
| `en.json` | English (source of truth) |
| `fr.json` | French |
| `de.json` | German |
| `it.json` | Italian |
| `es.json` | Spanish |
| `pt-BR.json` | Brazilian Portuguese |

## Conventions

- **Nested objects** group strings by feature (`header`, `progress`, `schedule`, …).
- **Nerd mode** uses `{ "normal": "…", "nerd": "…" }` pairs where both variants exist.
- **Interpolation** uses `{name}` placeholders — never split a sentence across keys.
- **Plurals** use CLDR-style keys: `one`, `other` (add `few` / `many` if your language needs them).
- **`_comment`** keys are ignored at runtime and may be used for translator notes.

## Workflow

1. Add or edit keys in `en.json` first.
2. Copy the same structure to every other locale file.
3. Run `npm run i18n:check` — the build also runs this and fails on missing keys or empty strings.

## Examples

```json
"schedule": {
  "today": { "normal": "Rest of today", "nerd": "Today's Quests" },
  "matchCount": {
    "one": "({count} match)",
    "other": "({count} matches)"
  }
}
```

```json
"footer": {
  "source": "Source: {source}"
}
```
