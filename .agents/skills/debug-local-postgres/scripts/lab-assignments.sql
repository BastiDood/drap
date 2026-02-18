-- Get all students assigned to a lab in a draft
-- Replace $lab_id$ with the lab ID and $draft_id$ with the draft ID
SELECT
    u.id AS user_id,
    u.email,
    u.given_name || ' ' || u.family_name AS full_name,
    u.student_number,
    fcu.round,
    CASE
        WHEN fcu.round IS NULL THEN 'Lottery'
        ELSE 'Round ' || fcu.round
    END AS selection_type,
    faculty.email AS selected_by_faculty
FROM drap.faculty_choice_user fcu
JOIN drap.user u ON u.id = fcu.student_user_id
LEFT JOIN drap.user faculty ON faculty.id = fcu.faculty_user_id
WHERE fcu.lab_id = $lab_id$::text
  AND fcu.draft_id = $draft_id$::bigint
ORDER BY fcu.round NULLS LAST, u.family_name, u.given_name;
