---
name: submit-pull-request
description: Create a PR with dev as base using the pull request template. Use when opening a new PR.
compatibility: Requires Git (`git`) and the GitHub CLI (`gh`).
user-invocable: true
disable-model-invocation: false
---

Summarize the latest changes in this branch to create a pull request on GitHub.

<workflow-steps>

1. Compare the current branch against `main` to see what changes need to be described in the pull request. Make sure to only focus on the finalized implementation details. Since pull requests tend to have work-in-progress commits at the beginning, you should be extra mindful on whether these are still relevant in the finalized snapshot.
2. Use the [pull request template](./assets/pull-request-template.md) to generate a `scratchpad/PR.md`. Fill in the placeholder sections and text.
3. Fill in the missing details in the following script and then run it:
   ```bash
   gh pr create --base main --head "$(git rev-parse --abbrev-ref HEAD)" --title 'category(scope): concise title' --body-file scratchpad/PR.md
   ```
4. Delete `scratchpad/PR.md` once successfully submitted.

</workflow-steps>

<pull-request-title-guidelines>

- Examine the commit messages that make up the pull request for inspiration
- Keep it short and sweet, encapsulating a summary of the implemented feature concisely in imperative form
- Use `category` specifiers like `feat`, `fix`, `docs`, `chore`, `deps`, etc. (consistent with the Conventional Commits message style)
- Determine the `scope` of the changes based on the most affected part of the codebase
  - `db`: database changes
  - `ui`: component library changes
  - `dev`: developer-only changes
  - `meta`: workflow-related changes
  - `api`: endpoint changes
  - `admin`, `faculty`, `student`, etc. for role-scoped changes in the app
  - `app`: final catch-all scope for general improvements in the app

</pull-request-title-guidelines>
