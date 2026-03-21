---
name: compile-digest
description: >
  Compile a digest of merged pull requests and commits up to a given point in time.
  Use when summarizing recent project activity, preparing release notes,
  or reviewing what changed over a period.
compatibility: Requires Git (`git`) and the GitHub CLI (`gh`).
allowed-tools:
  - Bash(date:*)
  - Bash(sh */scripts/digest-commits.sh *)
  - Bash(sh */scripts/digest-prs.sh *)
  - Bash(sh */scripts/digest-open-prs.sh *)
  - Bash(gh pr diff:*)
  - Bash(gh pr list:*)
  - Bash(gh pr view:*)
  - Bash(git log:*)
  - Bash(git show:*)
---

# Compile Digest

Compile a structured digest of all merged PRs, open PRs, and commits against the `main` branch since a provided cutoff date.

## Workflow

1. **Parse cutoff date**. Convert relative dates (e.g., "2 weeks ago") to ISO 8601 using `date -d` before passing to scripts.
2. **Fetch merged PR list** — run the following and capture the JSON output:
   ```shell
   sh ${CLAUDE_SKILL_DIR}/scripts/digest-prs.sh $ISO_DATE
   ```
3. **Fetch commit list** — run the following and capture the text output:
   ```shell
   sh ${CLAUDE_SKILL_DIR}/scripts/digest-commits.sh $ISO_DATE
   ```
4. **Fetch open PR list** — run the following and capture the JSON output:
   ```shell
   sh ${CLAUDE_SKILL_DIR}/scripts/digest-open-prs.sh $ISO_DATE
   ```
5. **Deep-dive each PR in parallel sub-agents** — for each PR in the merged and open lists, launch a parallel sub-agent that:
   - Runs `gh pr diff <number>` to get the diff
   - Runs `gh pr view <number> --json body,comments,reviews` for context
   - Runs `git show` (and similar commands) to learn more about the code changes
   - Returns a concise summary of notable code changes, following the mandatory [digest template](./assets/digest-template.md)
6. **Report** — tell the user the digest is at `scratchpad/DIGEST.md`.

## Script Customization

Scripts are starting points. Compose variants as needed (e.g., filter by label, author, or branch). The sub-agent exploration step can be adjusted for depth.

- [List Merged Pull Requests](scripts/digest-prs.sh)
- [List Open Pull Requests](scripts/digest-open-prs.sh)
- [List Commits](scripts/digest-commits.sh)
