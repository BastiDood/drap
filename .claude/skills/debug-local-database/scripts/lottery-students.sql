-- Get students who were assigned via lottery (round IS NULL)
-- Replace $draft_id$ with the draft ID
SELECT
    u.id AS user_id,
    u.email,
    u.given_name || ' ' || u.family_name AS full_name,
    u.student_number,
    fcu.lab_id AS assigned_lab,
    l.lab_name,
    fcu.faculty_user_id  -- NULL for lottery assignments
FROM drap.faculty_choice_user fcu
JOIN drap.user u ON u.id = fcu.student_user_id
JOIN drap.lab l ON l.lab_id = fcu.lab_id
WHERE fcu.draft_id = $draft_id$::bigint
  AND fcu.round IS NULL  -- Lottery assignments have NULL round
ORDER BY l.lab_name, u.family_name, u.given_name;
