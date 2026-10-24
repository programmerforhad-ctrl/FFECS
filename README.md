# FREE FIRE E-SPORTS COMMUNITY SYLHET - Website

Next.js 14 + Tailwind + Supabase. Deploys on Vercel from GitHub.

**Public pages:** Home, About, Management, Events, Tournaments, Contact, and shareable forms at `/form/<link-name>`.
**Admin panel (`/admin`):** edit site text/logo/contact/social links, management members, events, tournaments, and build forms (add questions, share link, view responses, download CSV).

## 1. Supabase setup (once)

1. Supabase Dashboard -> **SQL Editor** -> New query -> paste all of `supabase/schema.sql` -> Run.
2. **Authentication -> Users -> Add user** (email + password, tick *Auto Confirm User*). This is your admin login.
3. SQL Editor -> run (use your admin email):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'YOUR_ADMIN_EMAIL_HERE'
   on conflict do nothing;
   ```
4. **Authentication -> Providers -> Email**: turn OFF "Allow new users to sign up" so nobody else can create accounts.
5. Storage: bucket `Info` is created as public by the SQL (used for logos, photos, banners). `B-2`, `B-3`, `B-4` are untouched, only admins get access through the app.

## 2. Run locally (optional)

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 3. GitHub -> Vercel

1. Push this folder to a new GitHub repo (`.env.local` is git-ignored).
2. Vercel -> Add New Project -> import the repo.
3. Add these Environment Variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://jeqtpbikryycjshkirhp.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = your publishable key
   - `NEXT_PUBLIC_STORAGE_BUCKET` = `Info`
4. Deploy. Then open `/admin`, sign in, and fill Site Settings first.

## Photo uploads to Google Drive (no Supabase storage used)

When a form has a **Photo upload** question, the visitor's photo goes straight to a folder in *your* Google Drive. Only the Drive link is saved in the response. One-time setup (5 minutes):

1. In Google Drive create a folder, e.g. `FFECS Form Photos`. Open it and copy the ID from the URL: `drive.google.com/drive/folders/`**`THIS_PART`**
2. Go to **script.google.com** -> New project. Delete the sample code, paste all of `google-drive/Code.gs`, and replace `PASTE_YOUR_FOLDER_ID_HERE` with your folder ID. Save.
3. **Deploy -> New deployment -> type: Web app**. Set *Execute as*: **Me**, *Who has access*: **Anyone**. Click Deploy and **Authorize access** (Google shows an "unsafe app" warning for your own script: Advanced -> Go to project).
4. Copy the **Web app URL** (ends with `/exec`).
5. On the website: **/admin/settings -> Photo uploads (Google Drive)**, paste the URL, **Save all**.
6. In a form, add a question of type **Photo upload**. Photos appear in the Drive folder (one sub-folder per form), and each response shows a "View photo" link. Only you (the Drive owner) can open them, as they are not shared publicly.

If you edit `Code.gs` later: Deploy -> Manage deployments -> edit -> New version.

## Security notes

- The **secret key is NOT used anywhere** in this project and must never be added to it or to Vercel `NEXT_PUBLIC_*` variables. It was pasted in a chat, so rotate it: Supabase -> Project Settings -> API Keys -> regenerate the secret key.
- The publishable key is safe in the browser. Protection comes from Row Level Security in `schema.sql`: the public can only read published content and submit to open forms; only users listed in `admins` can write or read responses.
- Forms enforce on the server: open/closed, deadline, response limit, required email, and one response per email.

## How forms work

Admin -> Forms & Responses -> create form -> add questions (short/long text, number, phone, email, date, multiple choice, checkboxes, dropdown) -> Save -> Copy link and share. To show a "Register Now" button on a tournament, pick the form in the tournament editor.
