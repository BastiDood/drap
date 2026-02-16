-- Get active sessions for a user
-- Replace $user_id$ with the user's ULID
SELECT
    s.id AS session_id,
    s.user_id,
    u.email,
    u.given_name || ' ' || u.family_name AS full_name,
    s.expiration,
    CASE
        WHEN s.expiration > NOW() THEN 'Active'
        ELSE 'Expired'
    END AS status,
    s.expiration - NOW() AS time_remaining
FROM auth.session s
JOIN drap.user u ON u.id = s.user_id
WHERE s.user_id = $user_id$::ulid
ORDER BY s.expiration DESC;
