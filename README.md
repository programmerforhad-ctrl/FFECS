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

6. **Update v2 (teams, groups, matches, team login):** SQL Editor -> New query -> paste all of `supabase/update-v2.sql` -> Run. Run `schema.sql` first, then this one. Safe to run again.

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

## Tournament teams, groups, matches and the team portal (v2)

**Flow**
1. **Forms:** open your registration form -> **+ Add team registration questions** -> Save. (Or set a question's "Use this answer for" to team name / captain UID.) Email collection must be on.
2. **Tournaments -> Edit:** pick that form and set **Registration ends**. The form closes by itself at that time and the website shows a live countdown.
3. Teams appear in **Tournaments -> Teams & matches -> Teams** as people register. Duplicate captain UIDs are rejected.
4. Select teams: tick rows -> **Set status: Selected**. Use **Auto-fill groups** (Groups tab) to put selected teams into groups of 12, or move teams by hand.
5. **Email selected teams:** the Email button opens Gmail / your mail app with everyone in BCC and a ready message with the portal link. No email server needed.
6. **Matches tab:** add a match per group (start time, room ID, password, minutes before start to unlock). Use "create for every group" then edit each group's room details.
7. **Groups tab:** write the group info and "Top N teams qualify" (teams see both). After the matches, set teams to **Qualified**, **Eliminated** or **Disqualified** (write the reason, and an optional document link; the team sees it).
8. **Full report** button: a printable report with every team, group, match, disqualification reasons and notes. Print or Save as PDF. CSV download is there too.

**Team login (`/portal`)**: team email + captain UID. Room ID and password are never sent to the browser before the unlock time (the database checks the time, not the page). 5 wrong attempts per email locks login for 15 minutes.

Honest limits: a Free Fire UID is not secret (it shows in the game), so tell captains to keep their registration email private too, because login needs both. Rooms are hidden again 4 hours after the match start.
