# Setting up Supabase (Swim Opt 2.0)

About 15 minutes. Cost: $0 (free plan).

Start with a **staging** project for testing. The free plan allows 2 projects, so the live one for the carnival can be made the same way later.

Only made-up data goes in (the 620 test students). No real names until the principal and ICT approve.

## 1. Make the project

1. Go to https://supabase.com and press **Start your project**. Sign in (a GitHub account or your school email both work).
2. Press **New project**.
3. Fill in:
   - **Organization:** your own (Supabase makes one for you).
   - **Project name:** `ccas-swimming-staging`
   - **Database password:** press **Generate a password**, then save it in your password manager. You will not need it day to day. Do not send it to anyone, including Claude.
   - **Region:** **Asia-Pacific (Sydney)**. This keeps the data in Australia.
   - **Plan:** Free.
4. Press **Create new project**. Wait about 2 minutes until the project dashboard shows.

## 2. Turn on anonymous sign-in

Each iPad, phone and laptop signs in on its own without an account. The PIN then decides its job.

1. In the left menu, press **Authentication**.
2. Press **Sign In / Providers** (under Configuration).
3. Turn on **Allow anonymous sign-ins**.
4. Press **Save changes**.

Then raise the limit, so lots of devices at the pool can sign in on the same wifi:

5. Still in **Authentication**, press **Rate Limits**.
6. Find **Rate limit for anonymous users** (it says 30 per hour). Change it to **100**.
7. Press **Save changes**.

## 3. Make the tables

1. In the left menu, press **SQL Editor**.
2. Press **+ New query**.
3. Open `supabase/01-setup.sql` from the project folder. Copy all of it, paste it into the editor, and press **Run**.
4. It should say **Success. No rows returned**. If it shows red text, copy the message to Claude.
5. Press **+ New query** again. Do the same with `supabase/02-seed-test-students.sql`. It loads the 620 test students.

## 4. Copy the project address and key

1. Press **Project Settings** (the cog at the bottom of the left menu).
2. Press **Data API** and copy the **Project URL**. It looks like `https://abcdefghijkl.supabase.co`.
3. Press **API Keys** and copy the **publishable** key (starts with `sb_publishable_`). If you only see the older **anon public** key, copy that instead.
4. Paste both into the chat with Claude. They are safe to share: they go in the page anyway, and the security comes from the rules made in step 3.

**Never copy the secret key or the service_role key.** They skip every security rule.

## 5. Change the PINs (later)

The test PINs (Marshal 1111, Place Judge 2222, Recorder 3333, Time Slips 4444, Announcer 5555, Carnival Organiser 9999) stay while we test. Before staff use the app:

1. Open the app and type the Carnival Organiser PIN.
2. Pick the current year, then press **Carnival Organiser**.
3. In **1 Carnival details**, type a new 4-digit PIN beside each job and press **Change**. Every PIN must be different.

The PINs are kept on the server only. Each device can try 5 wrong PINs in 5 minutes, then it has to wait.

## Before the carnival

- Free projects pause after 7 days with nobody using them. The data is kept. To wake one, open the dashboard and press **Restore project**. Do this the day before the carnival.
- There are no automatic backups on the free plan. Press **Export CSV** in Carnival Organiser after the carnival.
