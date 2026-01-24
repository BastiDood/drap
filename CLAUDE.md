# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Additional Guidelines

- **Avoid `npx`:** Strongly prefer using package scripts defined in `package.json` (e.g., `pnpm lint`, `pnpm db:generate`) over invoking tools directly via `npx`. The project scripts are pre-configured with correct options and ensure consistent behavior.
