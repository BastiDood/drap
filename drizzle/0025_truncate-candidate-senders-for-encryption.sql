-- In preparation for encrypting the candidate sender tokens, we need to truncate the table.
-- Old access tokens and refresh tokens will effectively be invalidated.
TRUNCATE TABLE "email"."candidate_sender" CASCADE;
