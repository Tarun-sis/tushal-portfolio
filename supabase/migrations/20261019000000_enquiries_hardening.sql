/*
  Enquiries hardening — ADDITIVE ONLY (safe to run on the existing table).

  - Adds columns the new contact form needs (nothing is dropped or rewritten).
  - Relaxes NOT NULL on `email` and `budget` (the form no longer asks for budget,
    and visitors may leave a phone number instead of an email).
  - Adds length/shape CHECK constraints as NOT VALID so existing rows are never
    rejected; they apply to every new/updated row.
  - Adds indexes used by the API's rate limiter and for newest-first browsing.

  It does NOT touch the anon INSERT policy, so the currently deployed site keeps
  working until you deploy the new /api/enquiry endpoint.
  Lock-down of direct anon access lives in supabase/manual/lockdown_anon_access.sql
*/

ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS ip_hash text,
  ADD COLUMN IF NOT EXISTS source text;

ALTER TABLE public.enquiries ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.enquiries ALTER COLUMN budget DROP NOT NULL;

ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_lengths_chk;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_lengths_chk CHECK (
  char_length(name) BETWEEN 1 AND 100
  AND char_length(business_type) BETWEEN 1 AND 100
  AND char_length(requirements) BETWEEN 1 AND 2000
  AND (business_name IS NULL OR char_length(business_name) <= 120)
  AND (email IS NULL OR char_length(email) <= 160)
  AND (phone IS NULL OR char_length(phone) <= 30)
) NOT VALID;

ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_has_contact_chk;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_has_contact_chk CHECK (
  email IS NOT NULL OR phone IS NOT NULL
) NOT VALID;

ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_status_chk;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_status_chk CHECK (
  status IN ('new','contacted','in_progress','closed','spam')
) NOT VALID;

CREATE INDEX IF NOT EXISTS enquiries_ip_hash_created_idx
  ON public.enquiries (ip_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_created_idx
  ON public.enquiries (created_at DESC);
