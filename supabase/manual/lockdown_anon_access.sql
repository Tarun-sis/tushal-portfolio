/*
  Compatibility hardening for an existing Supabase database.

  The migration 20261020000000_admin_and_project_security.sql now applies
  these permissions automatically. This idempotent script can also be run
  manually after reviewing the new Vercel enquiry endpoint. It intentionally
  does not delete or alter enquiry rows.
*/

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_insert_enquiries" ON public.enquiries;
REVOKE ALL ON public.enquiries FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.enquiries TO authenticated;

-- The owner-only policies from the migration remain in force. This script
-- deliberately does not add any public or customer insert policy.
