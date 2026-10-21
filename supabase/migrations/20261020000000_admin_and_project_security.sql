-- Owner-only admin, private enquiries, published portfolio projects, and
-- atomic public-enquiry rate limits. Reuses the existing enquiries table.

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

CREATE TABLE IF NOT EXISTS private.portfolio_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.portfolio_admins FROM PUBLIC, anon, authenticated;
GRANT SELECT ON private.portfolio_admins TO service_role;

CREATE OR REPLACE FUNCTION public.is_portfolio_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.portfolio_admins
    WHERE user_id = (SELECT auth.uid())
  );
$$;
REVOKE ALL ON FUNCTION public.is_portfolio_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_portfolio_admin() TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text CHECK (display_name IS NULL OR char_length(display_name) <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (display_name) ON public.profiles TO authenticated;
DROP POLICY IF EXISTS "profile_owner_or_admin_read" ON public.profiles;
CREATE POLICY "profile_owner_or_admin_read"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_portfolio_admin()));
DROP POLICY IF EXISTS "profile_owner_update" ON public.profiles;
CREATE POLICY "profile_owner_update"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION private.create_profile_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, left(NULLIF(NEW.raw_user_meta_data ->> 'name', ''), 100))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.create_profile_for_auth_user() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.create_profile_for_auth_user();
INSERT INTO public.profiles (user_id, display_name)
SELECT id, left(NULLIF(raw_user_meta_data ->> 'name', ''), 100)
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION private.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.set_updated_at() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.enquiries
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.enquiries
SET subject = COALESCE(NULLIF(btrim(business_type), ''), 'Website enquiry')
WHERE subject IS NULL;
ALTER TABLE public.enquiries
  ALTER COLUMN subject SET DEFAULT 'Website enquiry',
  ALTER COLUMN subject SET NOT NULL;

ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_status_chk;
UPDATE public.enquiries
SET status = CASE status
  WHEN 'contacted' THEN 'replied'
  WHEN 'in_progress' THEN 'read'
  WHEN 'closed' THEN 'archived'
  WHEN 'spam' THEN 'archived'
  ELSE status
END
WHERE status IN ('contacted', 'in_progress', 'closed', 'spam');
ALTER TABLE public.enquiries
  DROP CONSTRAINT IF EXISTS enquiries_admin_status_chk;
ALTER TABLE public.enquiries
  ADD CONSTRAINT enquiries_admin_status_chk
  CHECK (status IN ('new', 'read', 'replied', 'archived'));
ALTER TABLE public.enquiries
  DROP CONSTRAINT IF EXISTS enquiries_subject_length_chk;
ALTER TABLE public.enquiries
  ADD CONSTRAINT enquiries_subject_length_chk
  CHECK (char_length(subject) BETWEEN 1 AND 160);
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.enquiries FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.enquiries TO authenticated;
DROP POLICY IF EXISTS "anon_insert_enquiries" ON public.enquiries;
DROP POLICY IF EXISTS "enquiries_admin_read" ON public.enquiries;
CREATE POLICY "enquiries_admin_read"
  ON public.enquiries FOR SELECT TO authenticated
  USING ((SELECT public.is_portfolio_admin()));
DROP POLICY IF EXISTS "enquiries_admin_update" ON public.enquiries;
CREATE POLICY "enquiries_admin_update"
  ON public.enquiries FOR UPDATE TO authenticated
  USING ((SELECT public.is_portfolio_admin()))
  WITH CHECK ((SELECT public.is_portfolio_admin()));
DROP POLICY IF EXISTS "enquiries_admin_delete" ON public.enquiries;
CREATE POLICY "enquiries_admin_delete"
  ON public.enquiries FOR DELETE TO authenticated
  USING ((SELECT public.is_portfolio_admin()));

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 500),
  url text NOT NULL CHECK (url ~ '^https://[^/?#[:space:]]+([/?#][^[:space:]]*)?$'),
  image_url text NOT NULL CHECK (
    (image_url LIKE '/%' AND image_url NOT LIKE '//%')
    OR image_url ~ '^https://[^/?#[:space:]]+([/?#][^[:space:]]*)?$'
  ),
  image_alt text NOT NULL CHECK (char_length(image_alt) BETWEEN 1 AND 300),
  image_note text NOT NULL DEFAULT 'Project preview',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.projects FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
DROP POLICY IF EXISTS "published_projects_public_read" ON public.projects;
CREATE POLICY "published_projects_public_read"
  ON public.projects FOR SELECT TO anon, authenticated
  USING (is_published OR (SELECT public.is_portfolio_admin()));
DROP POLICY IF EXISTS "projects_admin_insert" ON public.projects;
CREATE POLICY "projects_admin_insert"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_portfolio_admin()));
DROP POLICY IF EXISTS "projects_admin_update" ON public.projects;
CREATE POLICY "projects_admin_update"
  ON public.projects FOR UPDATE TO authenticated
  USING ((SELECT public.is_portfolio_admin()))
  WITH CHECK ((SELECT public.is_portfolio_admin()));
DROP POLICY IF EXISTS "projects_admin_delete" ON public.projects;
CREATE POLICY "projects_admin_delete"
  ON public.projects FOR DELETE TO authenticated
  USING ((SELECT public.is_portfolio_admin()));
CREATE INDEX IF NOT EXISTS projects_public_order_idx
  ON public.projects (sort_order, created_at)
  WHERE is_published;
DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
DROP TRIGGER IF EXISTS enquiries_set_updated_at ON public.enquiries;
CREATE TRIGGER enquiries_set_updated_at
  BEFORE UPDATE ON public.enquiries
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();
DROP TRIGGER IF EXISTS projects_set_updated_at ON public.projects;
CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

INSERT INTO public.projects (slug, name, description, url, image_url, image_alt, image_note, sort_order, is_published)
VALUES
  ('my-portfolio', 'My Portfolio Website',
   'My personal portfolio showcasing my projects, skills, and website development work.',
   'https://tushalsisodia-dev.vercel.app/', '/projects/portfolio-preview.svg',
   'Original illustration of Tushal’s dark developer portfolio with lime accents; not a live-site screenshot.',
   'Original interface illustration · not a screenshot', 1, true),
  ('civiclens-ai', 'CivicLens AI',
   'An AI-assisted civic intelligence prototype for reporting, prioritising, and tracking civic issues.',
   'https://civiclens-ai-bic.vercel.app/', '/projects/civiclens-preview.svg',
   'Original civic dashboard illustration with an abstract city map and example issue panels; not live civic data.',
   'Original dashboard illustration · example content', 2, true),
  ('urbannest-studio', 'UrbanNest Studio',
   'A real-estate website experience featuring modern property presentation and a polished browsing interface.',
   'https://urbannest-studio.vercel.app/', '/projects/urbannest-preview.svg',
   'Original warm-toned interior illustration for UrbanNest Studio; not a live-site screenshot.',
   'Original interior illustration · not a screenshot', 3, true)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS private.enquiry_rate_limits (
  bucket_key text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count > 0),
  PRIMARY KEY (bucket_key, window_start)
);
REVOKE ALL ON private.enquiry_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON private.enquiry_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_enquiry_rate_limit(p_ip_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_window timestamptz := date_trunc('hour', clock_timestamp());
  current_count integer;
BEGIN
  IF p_ip_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN false;
  END IF;

  DELETE FROM private.enquiry_rate_limits
  WHERE window_start < current_window - interval '2 hours';

  INSERT INTO private.enquiry_rate_limits AS limits (bucket_key, window_start, request_count)
  VALUES ('ip:' || p_ip_hash, current_window, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET request_count = limits.request_count + 1
  WHERE limits.request_count < 3
  RETURNING request_count INTO current_count;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO private.enquiry_rate_limits AS limits (bucket_key, window_start, request_count)
  VALUES ('global', current_window, 1)
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET request_count = limits.request_count + 1
  WHERE limits.request_count < 60
  RETURNING request_count INTO current_count;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_enquiry_rate_limit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_enquiry_rate_limit(text) TO service_role;

CREATE INDEX IF NOT EXISTS enquiries_status_created_idx
  ON public.enquiries (status, created_at DESC);
