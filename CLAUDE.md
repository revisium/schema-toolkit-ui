# CLAUDE.md - schema-toolkit-ui

React UI component library for JSON Schema editing (SchemaEditor, RowEditor, TableEditor). Built on @revisium/schema-toolkit, MobX, Chakra UI.

## Quick Reference

```bash
npm run build              # tsdown build (ESM + CJS + .d.ts)
npm run dev                # Watch mode
npm run tsc                # TypeScript type check (no emit)
npm test                   # Jest unit + Vitest storybook tests
npm run test:unit          # Jest only
npm run lint:ci            # ESLint (max-warnings 0)
npm run format             # Prettier write
npm run storybook          # Storybook dev (port 6006)
npm run storybook:test:ci  # Vitest CI with coverage
```

## Knowledge Base

Architectural knowledge for this library is stored in Revisium:
https://cloud.dev.revisium.io org: `revisium-kb`, project: `schema-toolkit-ui`

MCP server: `revisium-cloud-dev-io`

### Connecting

```
get_branch("revisium-kb", "schema-toolkit-ui", "master")
→ returns headRevisionId (committed) and draftRevisionId (working state)
```

- **draftRevisionId** — always use for reads. Contains latest content including uncommitted updates.
- **headRevisionId** — last committed snapshot. May lag behind draft.

### Loading context

Load relevant kb rows before exploring code:
- `get_row(draftRevisionId, "architecture", "overview")` — start here
- `get_rows(draftRevisionId, "modules")` — all modules overview
- `get_row(draftRevisionId, "modules", "<module-name>")` — per-module details
- `get_rows(draftRevisionId, "decisions")` — architectural decisions
- `get_row(draftRevisionId, "commands", "all-commands")` — all npm scripts
- `search_rows(draftRevisionId, "keyword")` — find anything

### Reviewing changes before commit

Before proposing `create_revision`, check what's pending:
- `get_revision_changes(draftRevisionId)` — shows all uncommitted row/table changes
- If no changes — nothing to commit
- If changes exist — summarize them to the user and ask for approval

### Trust level

KB may be outdated if code changed but kb was not updated.
Always verify critical details against actual code before relying on kb.
If you find a discrepancy — fix the code task first, then propose updating kb.

### Update rules

- **Read** — freely, no approval needed
- **Update row content** — after significant code changes, always update the relevant kb rows before finishing the task
- **Schema changes** (new tables, new fields) — ask the user first
- **create_revision** — ask the user first, show pending changes, batch related updates into one commit
