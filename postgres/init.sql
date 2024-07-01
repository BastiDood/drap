-- See `https://developers.google.com/identity/protocols/oauth2#size` for token sizes (in bytes).
-- Authorization Code: 256
-- Access Token:       2048
-- Refresh Token:      512
CREATE EXTENSION pgcrypto;

CREATE DOMAIN GoogleUserId AS VARCHAR(255);
CREATE DOMAIN Expiration AS TIMESTAMPTZ CHECK(VALUE > NOW());

CREATE TYPE UserLogin AS ENUM ('student', 'faculty', 'admin');

CREATE SCHEMA drap
    CREATE TABLE users (
        student_number BIGINT UNIQUE,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        email TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL PRIMARY KEY,
        given_name TEXT NOT NULL,
        family_name TEXT NOT NULL,
        avatar TEXT NOT NULL
    )
    CREATE TABLE pendings (
        session_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        expiration Expiration NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
        nonce BYTEA NOT NULL DEFAULT gen_random_bytes(64)
    )
    CREATE TABLE sessions (
        session_id UUID NOT NULL PRIMARY KEY,
        expiration Expiration NOT NULL,
        user_id GoogleUserId NOT NULL REFERENCES users (user_id)
    )
    CREATE TABLE labs (
        lab_id SMALLINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
        lab_name TEXT NOT NULL,
        quota SMALLINT NOT NULL
    )
    CREATE TABLE lab_members (
        lab_id SMALLINT NOT NULL REFERENCES labs (lab_id),
        member_id TEXT NOT NULL REFERENCES users (user_id),
        PRIMARY KEY (lab_id, member_id)
    )
    CREATE TABLE lab_invites (
        invite_id SMALLINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
        inviter_admin_id TEXT NOT NULL REFERENCES users (user_id),
        lab_id SMALLINT NOT NULL REFERENCES labs (lab_id),
        email TEXT NOT NULL,
        UNIQUE (lab_id, email)
    )
    CREATE TABLE admin_invites (
        invite_id SMALLINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
        inviter_admin_id TEXT NOT NULL REFERENCES users (user_id),
        email TEXT UNIQUE NOT NULL
    )
    CREATE TABLE drafts (
        draft_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
        curr_round SMALLINT NOT NULL DEFAULT 0,
        max_rounds SMALLINT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT curr_round_within_bounds CHECK (curr_round BETWEEN 0 AND max_rounds)
    )
    CREATE TABLE faculty_choices (
        choice_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        round SMALLINT NOT NULL,
        faculty_id TEXT NOT NULL REFERENCES users (user_id),
        lab_id SMALLINT NOT NULL REFERENCES labs (lab_id)
    )
    CREATE TABLE student_ranks (
        draft_id BIGINT NOT NULL REFERENCES drafts (draft_id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        chosen_by BIGINT UNIQUE REFERENCES faculty_choices (choice_id),
        labs SMALLINT[] NOT NULL, -- REFERENCES (EACH ELEMENT OF labs) labs (lab_id)
        user_id TEXT NOT NULL REFERENCES users (user_id),
        PRIMARY KEY (draft_id, user_id)
    );
