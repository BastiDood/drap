-- Check if a user with the given email exists
-- Replace $email$ with the actual email address
SELECT
    id,
    email,
    given_name,
    family_name,
    is_admin,
    lab_id,
    student_number,
    google_user_id IS NOT NULL AS has_logged_in,
    created_at
FROM drap.user
WHERE email = $email$::text;
