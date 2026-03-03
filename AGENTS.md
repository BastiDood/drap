# Project Overview

DRAP (Draft Ranking Automated Processor) automates the University of the Philippines Diliman - Department of Computer Science's yearly research lab assignment draft. Students submit ranked lab preferences; faculty review and accept students round-by-round; unassigned students go through intervention, lottery execution, admin review, and finalization.

For detailed domain knowledge (terminology, lifecycle, role workflows), see [the draft process document](docs/draft-process.md). If you're working on a new feature, you must first understand how the draft process works.

## Conventions

For the available project scripts and commands, see the [`package.json`](package.json) scripts and the bespoke [`scripts/`](scripts) directory.

For the `shadcn-svelte` UI configuration and aliases, see the [`components.json`](components.json) file.

## End-to-End Testing

Run Playwright tests with environment variables loaded:

```shell
# Ensure development-only services are spun up.
pnpm docker:dev
```

```bash
# Build first (required by playwright.config.js webServer command).
pnpm build
```

```bash
# Assumes current directory is the project root.
# Load only .env:
source ./scripts/test-playwright.sh

# Load .env + .env.<environment> + .env.<environment>.local:
source ./scripts/test-playwright.sh development
source ./scripts/test-playwright.sh production
```

```nu
# Load only .env:
nu ./scripts/test-playwright.nu

# Load .env + .env.<environment> + .env.<environment>.local:
nu ./scripts/test-playwright.nu development
nu ./scripts/test-playwright.nu production
```

**IMPORTANT:** Always run the end-to-end tests with the appropriate environment variables loaded. Running `pnpm test:playwright` directly will fail due to invalid environment variables.

# Pre-commit Workflow

**Always run `pnpm lint` then `pnpm fmt:fix` before committing.**

If errors appear:

1. Run `pnpm lint:eslint --fix` first to address low-hanging fruit (may not be necessary).
2. Analyze remaining errors with `pnpm lint:eslint` and `pnpm lint:svelte` individually.
3. Only run the linter that reports errors.

**After building features, write and run the new end-to-end tests with `pnpm test:playwright` as the final verification step.** See the [End-to-End Testing](#end-to-end-testing) section above for setup instructions.

# Additional Guidelines

- **Avoid `npx`:** Strongly prefer using package scripts defined in `package.json` (e.g., `pnpm lint`, `pnpm db:generate`) over invoking tools directly via `npx`. The project scripts are pre-configured with correct options and ensure consistent behavior.
- **Assume CWD is correct:** When running commands, do not use directory-changing flags like `git -C` or `pnpm --filter`. The current working directory is already the project root.
- **Learn from mistakes:** if the user corrects you on conventions or workflows, update your memory files accordingly so you will not make the same mistake ever again
