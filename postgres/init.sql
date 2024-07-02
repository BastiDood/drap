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
        -- match student_number, is_admin:
        --     case NULL, FALSE: Uninitialized
        --     case 0, FALSE:    Faculty
        --     case _, FALSE:    Student
        --     case _, TRUE:     Admin
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
        lab_id TEXT NOT NULL PRIMARY KEY,
        lab_name TEXT NOT NULL,
        quota SMALLINT NOT NULL DEFAULT 0
    )
    CREATE TABLE lab_members (
        lab_id TEXT NOT NULL REFERENCES labs (lab_id),
        member_id TEXT NOT NULL REFERENCES users (user_id),
        PRIMARY KEY (lab_id, member_id)
    )
    CREATE TABLE invites (
        invite_id SMALLINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
        inviter_admin_id TEXT NOT NULL REFERENCES users (user_id),
        lab_id TEXT REFERENCES labs (lab_id), -- NULL => Admin Invite
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
        lab_id TEXT NOT NULL REFERENCES labs (lab_id)
    )
    CREATE TABLE student_ranks (
        draft_id BIGINT NOT NULL REFERENCES drafts (draft_id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        chosen_by BIGINT UNIQUE REFERENCES faculty_choices (choice_id),
        user_id TEXT NOT NULL REFERENCES users (user_id),
        labs TEXT[] NOT NULL, -- REFERENCES (EACH ELEMENT OF labs) labs (lab_id)
        PRIMARY KEY (draft_id, user_id)
    );

INSERT INTO drap.labs (lab_id, lab_name) VALUES
    ('acl', 'Algorithms & Complexity Laboratory'),
    ('aclrl', 'Automata, Combinatorics, & Logic Research Laboratory'),
    ('csl', 'Computer Security Laboratory'),
    ('cvmil', 'Computer Vision & Machine Intelligence Laboratory'),
    ('ndsl', 'Networks & Distributed Systems Laboratory'),
    ('scl', 'Scientific Computing Laboratory'),
    ('s3', 'Service Science & Software Engineering Laboratory'),
    ('smsl', 'System Modelling & Simulation Laboratory'),
    ('wsl', 'Web Science Laboratory');
