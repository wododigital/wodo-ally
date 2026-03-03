# WODO Ally - Project Instructions for Claude Agents

> **Start here:** Read `CLAUDE-CODE-START-HERE.md` for full project context, build phases, and agent assignments before doing anything else.

---

## Model Routing (Token Efficiency)

Route by complexity - use the cheapest model that can handle the task:

- **Haiku:** file reads, simple edits, renaming, formatting, linting fixes, boilerplate generation, grep/search, straightforward CRUD endpoints, config changes, any task needing no reasoning
- **Sonnet:** writing new functions/modules, debugging, refactoring, API integrations, database schema design, middleware logic, test writing, multi-file changes needing context awareness
- **Opus:** complex architectural decisions, multi-system design, tricky cross-layer debugging, performance optimization analysis, or when Sonnet fails

Before executing, briefly assess complexity and pick the cheapest model. Default to Haiku unless reasoning is genuinely required. Batch related small changes into single calls. When reading files for context, read only relevant lines. Keep responses concise - skip explanations unless asked.

---

## Critical Rules

- NEVER use em dashes (--) anywhere. Use hyphens (-).
- ALWAYS follow the design system. No hardcoded colors.
- ALWAYS make pages responsive.
- ALWAYS use TypeScript strict mode.
- ALWAYS update PROJECT-INFO.md after completing a module.
- Use TanStack Query for server state, Zustand for UI state.
- Use React Hook Form + Zod for all forms.
- Use sonner for toast notifications.
- Use glass-card class for all card containers.
- Use the accent color (#fd7e14) for CTAs and highlights only.
