# FeedChain – Creating users and signing in

## 1. One-time database setup (Supabase)

Your `users` table must have a `password_hash` column for email/password sign-in.

1. Open your Supabase project → **SQL Editor**.
2. Run this (or the contents of `backend/migrations/add_password_hash.sql`):

```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

3. If you want one account per email, add a unique constraint:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);
```

---

## 2. Install backend dependency

From the project root:

```bash
cd backend
pip install passlib[bcrypt]
```

Or:

```bash
pip install -r requirements.txt
```

---

## 3. How to create a new user

### Option A: From the website (recommended)

1. Start the app: backend on port **8000**, frontend on **5173**.
2. Open **http://localhost:5173**.
3. Click **Sign in** → **Create one** (or go to **http://localhost:5173/register**).
4. Fill in:
   - **Email** – e.g. `donor@example.com`
   - **Password** – at least 6 characters (e.g. `mypassword123`)
   - **Confirm password** – same as password
   - **I am a** – Donor / NGO / Admin
5. Click **Create account**.
6. You’ll see a success message; then sign in on the login page with that **email** and **password**.

**You choose the password** – the app does not generate or show it again. Store it somewhere safe.

### Option B: With the API (e.g. Postman or curl)

**Register (create user):**

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"donor@example.com\",\"password\":\"mypassword123\",\"role\":\"donor\"}"
```

Response example:

```json
{
  "message": "User created. You can now sign in with this email and password.",
  "user_id": "uuid-here",
  "email": "donor@example.com",
  "role": "donor"
}
```

**Sign in:**

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"donor@example.com\",\"password\":\"mypassword123\"}"
```

You’ll get an `access_token` to use as `Authorization: Bearer <token>`.

---

## 4. Passwords – summary

| Question | Answer |
|----------|--------|
| Who sets the password? | **You** when you create the account (register). |
| Does the app show the password again? | **No.** Store it yourself. |
| Where is it stored? | Only a **hash** (bcrypt) is stored in `users.password_hash`. |
| Can I reset it? | Not in the app yet; you’d need a “forgot password” flow or DB update. |

---

## 5. Demo login (no password)

For quick testing you can still use **Demo (role only)** on the login page:

- Choose **Donor**, **NGO**, or **Admin** and click **Sign in**.
- No email or password is required; a temporary user is created in the DB.
- Use this only for local/demo use.
