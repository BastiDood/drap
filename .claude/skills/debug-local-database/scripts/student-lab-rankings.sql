-- Get a student's ranked lab preferences for a draft
-- Replace $user_id$ with the user's ULID and $draft_id$ with the draft ID
SELECT
    srl.index + 1 AS rank,
    srl.lab_id,
    l.lab_name,
    srl.remark
FROM drap.student_rank_lab srl
JOIN drap.lab l ON l.lab_id = srl.lab_id
WHERE srl.user_id = $user_id$::ulid
  AND srl.draft_id = $draft_id$::bigint
ORDER BY srl.index;
