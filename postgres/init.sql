CREATE SCHEMA drap;

-- See `https://developers.google.com/identity/protocols/oauth2#size` for token sizes (in bytes).
-- Authorization Code: 256
-- Access Token:       2048
-- Refresh Token:      512
CREATE EXTENSION pgcrypto WITH SCHEMA drap;

CREATE DOMAIN drap.GoogleUserId AS VARCHAR(255);

CREATE TABLE drap.labs (
    lab_id TEXT NOT NULL PRIMARY KEY,
    lab_name TEXT UNIQUE NOT NULL,
    quota SMALLINT NOT NULL DEFAULT 0 CHECK (quota >= 0)
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

CREATE TABLE drap.users (
    -- match is_admin, user_id, lab_id:
    --     case FALSE, NULL, NULL: Invited User
    --     case FALSE, NULL, _:    Invited Researcher
    --     case FALSE, _, NULL:    Registered User
    --     case FALSE, _, _:       Drafted Researcher
    --     case TRUE, NULL, NULL:  Invited Admin
    --     case TRUE, NULL, _:     Invited Faculty
    --     case TRUE, _, NULL:     Registered Admin
    --     case TRUE, _, _:        Registered Faculty
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    student_number BIGINT UNIQUE CONSTRAINT student_number_within_bounds CHECK (student_number BETWEEN 100000000 AND 1000000000),
    user_id drap.GoogleUserId UNIQUE,
    lab_id TEXT REFERENCES drap.labs (lab_id),
    email TEXT NOT NULL PRIMARY KEY,
    given_name TEXT NOT NULL DEFAULT '',
    family_name TEXT NOT NULL DEFAULT '',
    avatar TEXT NOT NULL DEFAULT ''
);

CREATE TABLE drap.pendings (
    session_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    expiration TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '15 minutes',
    nonce BYTEA NOT NULL DEFAULT drap.gen_random_bytes(64),
    has_extended_scope BOOLEAN NOT NULL
);

CREATE TABLE drap.sessions (
    session_id UUID NOT NULL PRIMARY KEY,
    expiration TIMESTAMPTZ NOT NULL,
    email TEXT NOT NULL REFERENCES drap.users (email)
);

CREATE TABLE drap.drafts (
    draft_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    curr_round SMALLINT DEFAULT 0,
    max_rounds SMALLINT NOT NULL CONSTRAINT max_rounds_above_floor CHECK (max_rounds > 0),
    active_period TSTZRANGE NOT NULL DEFAULT TSTZRANGE(NOW(), NULL, '[)'),
    CONSTRAINT curr_round_within_bounds CHECK (curr_round BETWEEN 0 AND max_rounds),
    CONSTRAINT overlapping_draft_periods EXCLUDE USING gist (active_period WITH &&)
);

CREATE TABLE drap.student_ranks (
    draft_id BIGINT NOT NULL REFERENCES drap.drafts (draft_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    email TEXT NOT NULL REFERENCES drap.users (email),
    labs TEXT[] NOT NULL, -- REFERENCES (EACH ELEMENT OF labs) labs (lab_id)
    PRIMARY KEY (draft_id, email)
);

CREATE TABLE drap.faculty_choices (
    choice_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    draft_id BIGINT NOT NULL REFERENCES drap.drafts (draft_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    round SMALLINT CONSTRAINT post_registration_round_only CHECK (round > 0),
    lab_id TEXT NOT NULL REFERENCES drap.labs (lab_id),
    faculty_email TEXT REFERENCES drap.users (email),
    UNIQUE NULLS NOT DISTINCT (draft_id, round, lab_id)
);

CREATE TABLE drap.faculty_choices_emails (
    choice_email_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    draft_id BIGINT NOT NULL REFERENCES drap.drafts (draft_id),
    round SMALLINT,
    lab_id TEXT NOT NULL REFERENCES drap.labs (lab_id),
    student_email TEXT NOT NULL REFERENCES drap.users (email),
    -- TODO: How do we enforce `student_email <> faculty_email`?
    FOREIGN KEY (draft_id, round, lab_id) REFERENCES drap.faculty_choices (draft_id, round, lab_id),
    UNIQUE (draft_id, student_email)
);

CREATE TABLE drap.candidate_senders (
    email TEXT NOT NULL REFERENCES drap.users (email) PRIMARY KEY,
    access_token TEXT NOT NULL CONSTRAINT access_token_length CHECK (length(access_token) <= 2048),
    refresh_token TEXT NOT NULL CONSTRAINT refresh_token_length CHECK (length(refresh_token) <= 512),
    expiration TIMESTAMPTZ NOT NULL
);

CREATE TABLE drap.designated_sender (
    email TEXT NOT NULL REFERENCES drap.candidate_senders (email) ON DELETE CASCADE PRIMARY KEY
);

CREATE TYPE drap.DraftNotificationType AS ENUM ('DraftRoundStarted', 'DraftRoundSubmitted', 'LotteryIntervention', 'DraftConcluded');

-- Notifications sent to multiple admins or lab heads.
CREATE TABLE drap.draft_notifications (
    notif_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    draft_id BIGINT NOT NULL REFERENCES drap.drafts (draft_id),
    -- [Admin] [Lab] DraftRoundStarted   (draft, round)
    -- [Admin]       DraftRoundSubmitted (draft, round, lab)
    -- [Admin] [Lab] LotteryIntervention (draft, lab, email)
    -- [Admin] [Lab] DraftConcluded      (draft)
    ty drap.DraftNotificationType NOT NULL,
    round SMALLINT,
    lab_id TEXT REFERENCES drap.labs (lab_id),
    email TEXT REFERENCES drap.users (email)
);

-- Notifications sent to particular users only. Used to notify lab assignments from draft results.
CREATE TABLE drap.user_notifications (
    notif_id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    lab_id TEXT NOT NULL REFERENCES drap.labs (lab_id),
    email TEXT NOT NULL REFERENCES drap.users (email)
);
