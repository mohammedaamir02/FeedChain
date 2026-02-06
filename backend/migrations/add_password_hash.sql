-- Run this in Supabase SQL Editor so email/password sign-in works.
-- Run once; safe to re-run (IF NOT EXISTS / IF NOT EXISTS).

-- For bcrypt-hashed passwords (nullable for existing demo users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- For registration: email is required for real accounts
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email TEXT;

-- Optional: one account per email
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email)
WHERE email IS NOT NULL;
