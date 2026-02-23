# Draft Process

## Terminology

- **Student (Draftee)**: A participant who submits ranked lab preferences.
- **Lab Head (Faculty)**: Reviews and selects which students to accept into their lab each round.
- **Administrator**: Manages the draft lifecycle, configures draft quota snapshots, and resolves edge cases.
- **Drafted**: A student who has been accepted by a lab. Drafted students exit the pool and do not participate in subsequent rounds.
- **Lab Catalog**: The list of labs managed on `/dashboard/labs/` (create, archive, restore).
- **Draft Quota Snapshot**: Per-draft quotas stored at draft creation and edited on `/dashboard/drafts/[draftId]/`.

## Draft Lifecycle

### 1. Registration Phase

An administrator creates a draft with a registration deadline and a fixed number of rounds. Students who have completed their profile (name, `@up.edu.ph` email, and student number) may then register by submitting an ordered list of lab preferences. Students may rank as many or as few labs as they wish, including none at all.

Registration closes at the deadline or when the administrator manually starts the draft, whichever comes first. Students who complete their profile after the draft has started are not included in the draft.

### 2. Regular Draft Rounds

The draft proceeds through a fixed number of rounds (e.g., 3). In Round _N_, each lab is presented with the undrafted students who ranked that lab as their _N_-th choice.

For each round:

1. Each lab head reviews the students whose _N_-th choice is their lab.
2. The lab head selects which of those students to accept (none, some, or all).
3. Accepted students become **drafted** and are removed from the pool.
4. Labs with no eligible students for a given round are automatically acknowledged and skipped.

Rounds continue sequentially until all rounds have been completed. If every student is drafted before all rounds finish, the remaining rounds are skipped entirely.

### 3. Lottery Phase

The lottery phase begins when undrafted students remain after all regular rounds have concluded. This phase has two stages:

#### Manual Intervention

Before any randomization occurs, administrators have a final opportunity to manually assign individual students to specific labs. This is intended for cases where a lab head and administrator agree on a placement outside the normal round process. Each manual assignment immediately removes that student from the lottery pool.

#### Quota Adjustment

Lab catalog updates in `/dashboard/labs/` are separate from active draft allocation. For each draft, the admin edits quota snapshots in `/dashboard/drafts/[draftId]/`:

1. During registration, **initial** snapshots may be adjusted for regular rounds.
2. During lottery, **lottery** snapshots may be adjusted for conclude allocation.

Before concluding, the **total lottery snapshot quota across labs must exactly match the remaining undrafted student count**. If not, conclude is rejected.

#### Randomized Assignment

When the administrator concludes the draft, the remaining students are randomly shuffled and distributed among labs in a round-robin fashion according to each lab's **lottery quota snapshot**. Because snapshot totals must match the remaining student count exactly, every undrafted student receives an assignment.

### 4. Conclusion

The draft is complete once every registered participant has been assigned to a lab — either through a regular round, manual intervention, or the lottery. All students, lab heads, and administrators are notified of the final results.

Students who were not part of the draft (e.g., those who registered after it started) are unaffected and will see no assignment.

## Role Workflows

### Student

1. `/dashboard/student/` — Complete profile (student number, set once)
2. `/dashboard/student/` — Submit lab preference rankings during registration
3. `/history/` — Track draft progress and view past results
4. `/dashboard/student/` — View final lab assignment after conclusion

### Lab Head

1. `/dashboard/lab/` — View lab details and assigned members
2. `/dashboard/students/` — Each round, review and select students who chose the lab
3. During lottery — Coordinate with administrators on remaining placements
4. `/dashboard/lab/` — View newly assigned members after conclusion

### Administrator

1. `/dashboard/labs/` — Manage lab catalog (create + archive/restore)
2. `/dashboard/drafts/` — Create a new draft (set deadline and round count; captures initial snapshots)
3. Wait for student registrations
4. `/dashboard/drafts/[draftId]/` — (Optional) adjust initial quota snapshots during registration
5. `/dashboard/drafts/` — Start the draft
6. Monitor round progression (labs are notified automatically)
7. `/dashboard/drafts/[draftId]/` — During lottery, apply manual interventions and adjust lottery snapshots
8. `/dashboard/drafts/` — Conclude the draft (triggers randomized assignment and notifications)
