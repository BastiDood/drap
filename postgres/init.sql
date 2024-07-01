-- See `https://developers.google.com/identity/protocols/oauth2#size` for token sizes (in bytes).
-- Authorization Code: 256
-- Access Token:       2048
-- Refresh Token:      512
CREATE EXTENSION pgcrypto;

CREATE DOMAIN GoogleUserId AS VARCHAR(255);
CREATE DOMAIN Expiration AS TIMESTAMPTZ CHECK(VALUE > NOW());

CREATE SCHEMA drap
    CREATE TABLE users (
        student_number BIGINT,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        is_faculty BOOLEAN NOT NULL DEFAULT FALSE,
        email TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        given_name TEXT NOT NULL,
        family_name TEXT NOT NULL,
        avatar TEXT NOT NULL,
        PRIMARY KEY (user_id),
        CHECK (
            student_number IS NULL AND (is_admin OR is_faculty)
            OR
            student_number IS NOT NULL AND NOT (is_admin OR is_faculty)
        )
    )
    CREATE TABLE pendings (
        session_id UUID NOT NULL DEFAULT gen_random_uuid(),
        expiration Expiration NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
        nonce BYTEA NOT NULL DEFAULT gen_random_bytes(64),
        PRIMARY KEY (session_id)
    )
    CREATE TABLE sessions (
        session_id UUID NOT NULL,
        expiration Expiration NOT NULL,
        user_id GoogleUserId NOT NULL REFERENCES users (user_id),
        PRIMARY KEY (session_id)
    )
    CREATE TABLE labs (
        lab_id SMALLINT GENERATED ALWAYS AS IDENTITY NOT NULL,
        lab_name TEXT NOT NULL,
        quota SMALLINT NOT NULL,
        PRIMARY KEY (lab_id)
    )
    CREATE TABLE lab_invites (
        invite_id SMALLINT GENERATED ALWAYS AS IDENTITY NOT NULL,
        lab_id SMALLINT NOT NULL REFERENCES labs (lab_id),
        email TEXT NOT NULL,
        PRIMARY KEY (invite_id)
    )
    CREATE TABLE lab_members (
        member_id TEXT NOT NULL REFERENCES users (user_id),
        lab_id SMALLINT NOT NULL REFERENCES labs (lab_id),
        PRIMARY KEY (member_id)
    )
    CREATE TABLE drafts (
        draft_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
        curr_round SMALLINT NOT NULL,
        max_rounds SMALLINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (draft_id)
    )
    CREATE TABLE faculty_choices (
        choice_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        round SMALLINT NOT NULL,
        faculty_id TEXT NOT NULL REFERENCES users (user_id),
        lab_id SMALLINT NOT NULL REFERENCES labs (lab_id),
        PRIMARY KEY (choice_id)
    )
    CREATE TABLE student_ranks (
        draft_id BIGINT NOT NULL REFERENCES drafts (draft_id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        chosen_by BIGINT UNIQUE REFERENCES faculty_choices (choice_id),
        labs SMALLINT[] NOT NULL, -- REFERENCES (EACH ELEMENT OF labs) labs (lab_id)
        user_id TEXT NOT NULL REFERENCES users (user_id),
        PRIMARY KEY (draft_id, user_id)
    );
