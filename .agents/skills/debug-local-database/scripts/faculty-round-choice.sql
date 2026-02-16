-- Get faculty choices for a specific lab in a draft round
-- Replace $lab_id$ with the lab ID, $draft_id$ with the draft ID, and $round$ with the round number
SELECT
    fc.lab_id,
    l.lab_name,
    fc.round,
    fc.created_at AS choice_submitted_at,
    faculty.email AS faculty_email,
    faculty.given_name || ' ' || faculty.family_name AS faculty_name,
    student.id AS student_id,
    student.email AS student_email,
    student.given_name || ' ' || student.family_name AS student_name,
    student.student_number
FROM drap.faculty_choice fc
JOIN drap.lab l ON l.lab_id = fc.lab_id
LEFT JOIN drap.user faculty ON faculty.id = fc.user_id
LEFT JOIN drap.faculty_choice_user fcu ON fcu.draft_id = fc.draft_id
    AND fcu.round = fc.round
    AND fcu.lab_id = fc.lab_id
LEFT JOIN drap.user student ON student.id = fcu.student_user_id
WHERE fc.lab_id = $lab_id$::text
  AND fc.draft_id = $draft_id$::bigint
  AND fc.round = $round$::smallint
ORDER BY student.family_name, student.given_name;
