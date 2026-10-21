# Tushal Sisodia — Portfolio

Vite + React + TypeScript portfolio with a server-validated public enquiry form and an owner-only Supabase Auth admin area.

## Local development

```bash
npm install
npm run dev
```

`vite` serves the public portfolio only. To run the Vercel API function locally, use `npx vercel dev` after configuring the server environment variables in Vercel's local development workflow.

## Supabase setup

The migration assumes the existing `public.enquiries` table and earlier migrations have already been applied. Run migrations in order in the Supabase SQL editor:

1. `supabase/migrations/20261011161909_create_enquiries_table.sql` if the existing enquiry table has not yet been created.
2. `supabase/migrations/20261019000000_enquiries_hardening.sql`.
3. `supabase/migrations/20261020000000_admin_and_project_security.sql`.

The last migration reuses `enquiries`, adds the `profiles` and `projects` tables, seeds the three current portfolio projects (without overwriting existing edited rows), creates a private admin allow-list and atomic enquiry rate-limit storage, and enables RLS. It removes direct browser insert privileges on enquiries; new public submissions go through `api/enquiry.ts`.

### Create the first administrator

1. In Supabase Authentication settings, disable public sign-ups. Create the owner account from the Supabase dashboard or another trusted administrative method.
2. Confirm the owner's email using Supabase's trusted admin tooling.
3. Copy the owner's auth UUID from **Authentication → Users**.
4. In the SQL editor, grant that specific account admin access:

   ```sql
   INSERT INTO private.portfolio_admins (user_id)
   VALUES ('REPLACE-WITH-THE-OWNER-AUTH-UUID');
   ```

   This table is inaccessible to `anon` and `authenticated`; users cannot grant themselves admin.
5. Sign in at `/login`; the dashboard is at `/admin`. If access must be removed, delete that owner's UUID from `private.portfolio_admins` using trusted SQL/admin tooling. Password recovery is handled by Supabase Auth.

Do not create an admin by adding a user metadata field or editing a browser profile. Admin authorization is checked against the private database allow-list and enforced again by RLS.

### Authentication redirect URLs

In **Authentication → URL Configuration**, set the Site URL to `https://tushalsisodia-dev.vercel.app`. Add the exact redirect URL `https://tushalsisodia-dev.vercel.app/login`; add local preview URLs only when testing recovery locally. Do not use broad wildcard production redirects.

No public signup/customer account UI is provided. The public contact form remains available without an account.

## Vercel environment variables

Set these for the correct Vercel environments (Production and Preview where required). Never prefix server secrets with `VITE_`.

| Variable | Exposure | Required | Purpose |
| --- | --- | --- | --- |
| `SUPABASE_URL` | Server only | Yes | Supabase project URL for the Vercel enquiry function. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Yes | Server-only permission to insert enquiries and call the private rate-limit function. Never expose or commit this key. |
| `RATE_LIMIT_SALT` | Server only | Yes | Random secret of at least 32 characters used to hash visitor IPs. |
| `ALLOWED_ORIGINS` | Server only | Yes in production | Comma-separated exact trusted origins, e.g. `https://tushalsisodia-dev.vercel.app`. |
| `VITE_SUPABASE_URL` | Public | Yes for login and project management | Supabase project URL. |
| `VITE_SUPABASE_ANON_KEY` | Public | Yes for login and project management | Supabase anon/publishable key; RLS, not key secrecy, protects data. |
| `VITE_CONTACT_EMAIL` | Public | Optional | Public contact detail shown on the portfolio. |
| `VITE_WHATSAPP` | Public | Optional | Public WhatsApp contact shown on the portfolio. |

`.env.example` contains placeholders only. Real local environment files are ignored by Git. Never use the service-role key in frontend code.

## Data access and security model

- `profiles`: Auth-linked profile rows. Users can read/update their own display name; admin can read profiles. There is no user-editable role.
- `enquiries`: public form input is validated and rate-limited by the Vercel function. Anonymous/authenticated clients cannot select, insert, update, or delete enquiry rows. The explicitly allow-listed owner can manage them through RLS.
- `projects`: public/anonymous reads are limited to published rows. Only the explicitly allow-listed owner can create, edit, reorder, publish, or unpublish projects.
- `private.portfolio_admins` and `private.enquiry_rate_limits`: private schema tables unavailable to public/authenticated API roles. The admin-check and rate-limit RPC functions are narrowly granted.

An administrator can view inbox status counts, search/filter/open enquiries, mark them unread/read/replied/archived, copy contact details, open an email draft, and delete only after a confirmation prompt. The site does not send email or claim delivery.

## Verify

```bash
npm run typecheck
npm run lint
npm run build
```

Before launch, apply the migration in the intended Supabase project, configure the environment/redirect URLs, create and authorize the owner, then test auth recovery, owner-only RLS, published-project visibility, and an actual enquiry submission against that project. No production deployment or live database operation is performed by these instructions.
