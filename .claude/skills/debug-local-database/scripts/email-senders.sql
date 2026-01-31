-- Get email sender configuration (no parameters needed)
SELECT
    u.id AS user_id,
    u.email,
    u.given_name || ' ' || u.family_name AS full_name,
    cs.scopes,
    cs.expiration AS token_expiration,
    CASE
        WHEN cs.expiration > NOW() THEN 'Valid'
        ELSE 'Expired'
    END AS token_status,
    cs.created_at AS authorized_at,
    cs.updated_at AS last_refreshed,
    ds.candidate_sender_user_id IS NOT NULL AS is_designated
FROM email.candidate_sender cs
JOIN drap.user u ON u.id = cs.user_id
LEFT JOIN email.designated_sender ds ON ds.candidate_sender_user_id = cs.user_id
ORDER BY ds.candidate_sender_user_id IS NOT NULL DESC, cs.created_at DESC;
