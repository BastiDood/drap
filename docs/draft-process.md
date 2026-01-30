# Draft Process Domain Knowledge

## Terminology

- **Draftee/Student**: A participant who submits ranked lab preferences
- **Lab Head/Faculty**: Selects which students to accept into their lab
- **Administrator**: Manages the draft lifecycle and resolves edge cases
- **Drafted**: A student who has been accepted by a lab (no longer participates in future rounds)

## Draft Lifecycle

### 1. Registration Phase

Students register by providing:

- Full name
- Email (`@up.edu.ph` only)
- Student number (set once, immutable)
- Lab rankings ordered by preference

### 2. Regular Draft Rounds

Each round:

1. Admins notify lab heads about students who chose their lab as **current-round choice**
2. Labs select a subset (none, some, or all) of these students
3. Selected students become "drafted" and exit the pool
4. Next round evaluates the **next preference** of remaining students

Rounds continue until either:

- All students are drafted, OR
- No more preferences remain (lottery begins)

### 3. Lottery Phase

Triggered when students remain after all regular rounds:

1. **Manual intervention**: Admins negotiate with labs that have remaining slots; labs may accept students immediately
2. **Randomized assignment**: Remaining students are shuffled and assigned round-robin to labs with available slots

### 4. Conclusion

Draft ends when all registered participants have been assigned to a lab.

## Role Workflows

### Student Flow

1. `/profile/` - Set student number (one-time)
2. `/dashboard/ranks/` - Submit lab rankings
3. `/history/` - Track draft progress
4. Wait for assignment

### Lab Head Flow

1. Wait for draft to open
2. `/dashboard/students/` - Select draftees who chose their lab each round
3. During lottery: negotiate with admins for remaining students
4. Wait for final results

### Administrator Flow

1. `/dashboard/labs/` - Set lab quotas
2. `/dashboard/drafts/` - Initialize new draft
3. Wait for student registrations
4. `/dashboard/drafts/` - Start draft (triggers notifications to labs)
5. `/history/` - Audit progress
6. After regular rounds: resolve remaining students via negotiation
7. `/dashboard/drafts/` - Apply manual interventions
8. `/dashboard/drafts/` - Conclude draft (triggers lottery if needed)
