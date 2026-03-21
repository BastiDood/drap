---
name: compile-digest
description: >
  Compile a digest of merged pull requests and commits up to a given point in time.
  Use when summarizing recent project activity, preparing release notes,
  or reviewing what changed over a period.
compatibility: Requires Git (`git`) and the GitHub CLI (`gh`).
allowed-tools:
  - Bash(date:*)
  - Bash(source */scripts/digest-commits.sh *)
  - Bash(source */scripts/digest-merged-prs.sh *)
  - Bash(source */scripts/digest-open-prs.sh *)
  - Bash(gh pr list:*)
---

# Compile Digest

Compile a structured digest of all merged PRs, open PRs, and commits against the `main` branch since a provided cutoff date.

## Workflow

1. **Parse cutoff date**. Convert relative dates (e.g., "2 weeks ago") to ISO 8601 using `date -d` before passing to scripts.
2. **Fetch merged PR list** — run the following and capture the JSON output:
   ```shell
   source ${CLAUDE_SKILL_DIR}/scripts/digest-merged-prs.sh $ISO_DATE
   ```
3. **Fetch commit list** — run the following and capture the text output:
   ```shell
   source ${CLAUDE_SKILL_DIR}/scripts/digest-commits.sh $ISO_DATE
   ```
4. **Fetch open PR list** — run the following and capture the JSON output:
   ```shell
   source ${CLAUDE_SKILL_DIR}/scripts/digest-open-prs.sh $ISO_DATE
   ```
5. **Deep-dive each PR in parallel sub-agents** — for each PR in the merged and open lists, launch the `pull-request-explorer` sub-agent. Pass the PR number in the prompt. Collect each agent's raw findings.
6. **Assemble digest** — distill the collected findings into the [digest template](./assets/digest-template.md).
   Each bullet should be one focused technical point — no compound sentences merging unrelated changes.
   Parenthetical (reason) when a mechanism change isn't self-evident. `Breaking:` bullet always last.
   Merged PRs in merge order (oldest first), open PRs in creation order (oldest first).
   Write the result to `scratchpad/DIGEST.md` and tell the user.

## Script Customization

Scripts are starting points. Compose variants as needed (e.g., filter by label, author, or branch). The sub-agent exploration step can be adjusted for depth.

- [List Merged Pull Requests](scripts/digest-merged-prs.sh)
- [List Open Pull Requests](scripts/digest-open-prs.sh)
- [List Commits](scripts/digest-commits.sh)
