-- Check when a student submitted their rankings for a draft
-- Replace $user_id$ with the user's ULID and $draft_id$ with the draft ID
SELECT
    sr.user_id,
    u.email,
    u.given_name || ' ' || u.family_name AS full_name,
    sr.draft_id,
    sr.created_at AS submitted_at,
    COUNT(srl.lab_id) AS labs_ranked
FROM drap.student_rank sr
JOIN drap.user u ON u.id = sr.user_id
LEFT JOIN drap.student_rank_lab srl ON srl.user_id = sr.user_id AND srl.draft_id = sr.draft_id
WHERE sr.user_id = $user_id$::ulid
  AND sr.draft_id = $draft_id$::bigint
GROUP BY sr.user_id, u.email, u.given_name, u.family_name, sr.draft_id, sr.created_at;
