# Code Conventions

**Before modifying source code:**

1. **Explore first.** Read relevant files, trace code paths, understand existing patterns.
2. **Follow conventions.** Adhere to guidelines in this file and subdirectory memory files/documentation.

## Code Style References

When implementing a new feature, you MUST adhere to the following code style references. Only read what is relevant to the current task.

- [TypeScript conventions](TYPESCRIPT.md)
- [Svelte conventions](SVELTE.md)
- [OpenTelemetry](OPEN-TELEMETRY.md) - Required for `load` functions and form actions
- [Form handling](FORM-HANDLING.md) - Required for all form submissions

## Project Memory Guidelines

When you consistently make mistakes on a user request, make sure to update your memory files to avoid making the same mistake again. Only update the appropriately scoped memory file to avoid context bloat in unrelated areas of the codebase.
