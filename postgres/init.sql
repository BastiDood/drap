-- See `https://developers.google.com/identity/protocols/oauth2#size` for token sizes (in bytes).
-- Authorization Code: 256
-- Access Token:       2048
-- Refresh Token:      512
CREATE EXTENSION pgcrypto;

CREATE DOMAIN GoogleUserId AS VARCHAR(255);
CREATE DOMAIN Expiration AS TIMESTAMPTZ CHECK(VALUE > NOW());

CREATE SCHEMA drap
    CREATE TABLE labs (
        lab_id TEXT NOT NULL PRIMARY KEY,
        lab_name TEXT NOT NULL,
        quota SMALLINT NOT NULL DEFAULT 0
    )
    CREATE TABLE users (
        -- match is_admin, user_id, lab_id:
        --     case FALSE, NULL, NULL: Invited User
        --     case FALSE, NULL, _:    Invited Researcher
        --     case FALSE, _, NULL:    Registered User
        --     case FALSE, _, _:       Drafted Researcher
        --     case TRUE, NULL, NULL:  Invited Admin
        --     case TRUE, NULL, _:     ???
        --     case TRUE, _, NULL:     Registered Admin
        --     case TRUE, _, _:        Registered Faculty
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        student_number BIGINT UNIQUE CONSTRAINT student_number_within_bounds CHECK (student_number BETWEEN 100000000 AND 1000000000),
        user_id GoogleUserId UNIQUE,
        lab_id TEXT REFERENCES labs (lab_id),
        email TEXT NOT NULL PRIMARY KEY,
        given_name TEXT NOT NULL DEFAULT '',
        family_name TEXT NOT NULL DEFAULT '',
        avatar TEXT NOT NULL DEFAULT ''
    )
    CREATE TABLE pendings (
        session_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
        expiration Expiration NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
        nonce BYTEA NOT NULL DEFAULT gen_random_bytes(64)
    )
    CREATE TABLE sessions (
        session_id UUID NOT NULL PRIMARY KEY,
        expiration Expiration NOT NULL,
        email TEXT NOT NULL REFERENCES users (email)
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
        faculty_email TEXT NOT NULL REFERENCES users (email),
        lab_id TEXT NOT NULL REFERENCES labs (lab_id)
    )
    CREATE TABLE student_ranks (
        draft_id BIGINT NOT NULL REFERENCES drafts (draft_id),
        chosen_by BIGINT UNIQUE REFERENCES faculty_choices (choice_id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        email TEXT NOT NULL REFERENCES users (email),
        labs TEXT[] NOT NULL, -- REFERENCES (EACH ELEMENT OF labs) labs (lab_id)
        PRIMARY KEY (draft_id, email)
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
