-- Get students who submitted rankings but haven't been selected yet
-- Replace $draft_id$ with the draft ID
SELECT
    u.id AS user_id,
    u.email,
    u.given_name || ' ' || u.family_name AS full_name,
    u.student_number,
    sr.created_at AS rankings_submitted_at,
    COUNT(srl.lab_id) AS labs_ranked
FROM drap.student_rank sr
JOIN drap.user u ON u.id = sr.user_id
LEFT JOIN drap.student_rank_lab srl ON srl.user_id = sr.user_id AND srl.draft_id = sr.draft_id
LEFT JOIN drap.faculty_choice_user fcu ON fcu.student_user_id = sr.user_id AND fcu.draft_id = sr.draft_id
WHERE sr.draft_id = $draft_id$::bigint
  AND fcu.student_user_id IS NULL  -- Not yet selected
GROUP BY u.id, u.email, u.given_name, u.family_name, u.student_number, sr.created_at
ORDER BY sr.created_at;
