-- Get the current state of a draft
-- Replace $draft_id$ with the draft ID
SELECT
    d.id AS draft_id,
    d.curr_round,
    d.max_rounds,
    d.registration_closes_at,
    d.active_period,
    CASE
        WHEN d.curr_round IS NULL THEN 'Not Started'
        WHEN d.curr_round = 0 THEN 'Registration'
        WHEN d.curr_round > d.max_rounds THEN 'Completed'
        ELSE 'Round ' || d.curr_round || ' of ' || d.max_rounds
    END AS status,
    (SELECT COUNT(*) FROM drap.student_rank sr WHERE sr.draft_id = d.id) AS students_registered,
    (SELECT COUNT(DISTINCT fcu.student_user_id) FROM drap.faculty_choice_user fcu WHERE fcu.draft_id = d.id) AS students_assigned
FROM drap.draft d
WHERE d.id = $draft_id$::bigint;
