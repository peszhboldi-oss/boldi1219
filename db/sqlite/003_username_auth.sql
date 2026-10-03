-- Preserve existing account IDs, password hashes, sessions and client data.
-- Former email identifiers remain valid usernames until a coach changes them.
ALTER TABLE accounts RENAME COLUMN email TO username;
CREATE UNIQUE INDEX accounts_username_normalized ON accounts(lower(username)) WHERE username IS NOT NULL;
DROP TABLE invitations;
