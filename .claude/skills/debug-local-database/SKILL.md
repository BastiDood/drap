---
name: debug-local-database
description: >
  MUST be used whenever the agent needs to query, inspect, or debug values from the local
  PostgreSQL database. This includes checking user data, draft states, lab assignments,
  student rankings, faculty choices, or any other database-stored information.
user-invocable: false
disable-model-invocation: false
allowed-tools:
  - Read
  - Bash(docker compose exec postgres psql:*)
---

# Debug Database Skill

Query and inspect the local PostgreSQL database for debugging.

**IMPORTANT:** All queries MUST be READ-ONLY (`SELECT` statements only). Do NOT execute `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `DROP`, or any other dangerous data-modifying statements unless the user EXPLICITLY requests a write operation.

## Prerequisites

Before writing queries, read the database schema files to understand table structures:

- `src/lib/server/database/schema/app.ts` - Main app tables (`drap` schema)
- `src/lib/server/database/schema/auth.ts` - Session tables (`auth` schema)
- `src/lib/server/database/schema/email.ts` - Email sender tables (`email` schema)

## Connection

```bash
docker compose exec postgres psql
```

No auth flags needed (local Unix socket with `trust` auth). The database has three schemas:

| Schema  | Purpose                                           |
| ------- | ------------------------------------------------- |
| `drap`  | App data (users, labs, drafts, rankings, choices) |
| `auth`  | Sessions                                          |
| `email` | Email sender configuration                        |

## Key Tables

### `drap` Schema

| Table                      | Purpose                                     |
| -------------------------- | ------------------------------------------- |
| `drap.user`                | All users (students, faculty, admins)       |
| `drap.lab`                 | Research labs                               |
| `drap.draft`               | Draft instances with round state            |
| `drap.student_rank`        | Student ranking submission timestamps       |
| `drap.student_rank_lab`    | Individual lab rankings per student         |
| `drap.faculty_choice`      | Faculty round selections (header)           |
| `drap.faculty_choice_user` | Students selected by faculty per round      |
| `drap.lab_member_view`     | View joining faculty choices with user info |
| `drap.active_lab_view`     | View of non-deleted labs                    |

### `auth` Schema

| Table          | Purpose              |
| -------------- | -------------------- |
| `auth.session` | Active user sessions |

### `email` Schema

| Table                     | Purpose                                 |
| ------------------------- | --------------------------------------- |
| `email.candidate_sender`  | Users who have authorized email sending |
| `email.designated_sender` | Currently active email sender           |

## SQL Scripts

Pre-written queries for common debugging scenarios:

| Script                                                             | Use Case                                |
| ------------------------------------------------------------------ | --------------------------------------- |
| [user-registered.sql](scripts/user-registered.sql)                 | Check if a user with given email exists |
| [user-ranking-submission.sql](scripts/user-ranking-submission.sql) | When a student submitted rankings       |
| [student-lab-rankings.sql](scripts/student-lab-rankings.sql)       | Get student's ranked lab preferences    |
| [faculty-round-choice.sql](scripts/faculty-round-choice.sql)       | What faculty chose in a specific round  |
| [pending-students.sql](scripts/pending-students.sql)               | Students still awaiting selection       |
| [lottery-students.sql](scripts/lottery-students.sql)               | Students who entered the lottery        |
| [lab-assignments.sql](scripts/lab-assignments.sql)                 | Current lab member assignments          |
| [draft-status.sql](scripts/draft-status.sql)                       | Current draft state and round           |
| [active-sessions.sql](scripts/active-sessions.sql)                 | Debug user sessions                     |
| [email-senders.sql](scripts/email-senders.sql)                     | Email sender configuration              |

## SQL Conventions

- Use `$placeholder$` syntax for parameters (replace with actual values)
- Add explicit type casts: `$email$::text`, `$user_id$::ulid`, `$draft_id$::bigint`
- Always qualify table names with schema (e.g., `drap.user`)

## Example Usage

```bash
# List all tables
docker compose exec postgres psql -c '\dt drap.*'

# Run a query
docker compose exec postgres psql -c "SELECT * FROM drap.user WHERE email = 'test@up.edu.ph'"

# Interactive mode
docker compose exec postgres psql
```
