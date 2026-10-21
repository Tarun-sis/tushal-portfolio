/*
# Create contact enquiries table (single-tenant, no auth)

## Purpose
Stores project enquiry submissions from the portfolio contact form.
Tushal views these in the Supabase dashboard — no public read access.

## New Tables
- `enquiries`
  - `id` (uuid, primary key)
  - `name` (text, not null) — submitter's name
  - `business_type` (text, not null) — type of business or project
  - `email` (text, not null) — contact email
  - `requirements` (text, not null) — project description
  - `budget` (text, not null) — selected budget range
  - `deadline` (text, nullable) — optional preferred deadline
  - `status` (text, default 'new') — enquiry status for tracking
  - `created_at` (timestamptz, default now()) — submission timestamp

## Security
- RLS enabled on `enquiries`.
- INSERT only for anon + authenticated (visitors submit forms).
- No SELECT/UPDATE/DELETE for anon — enquiries are private.
  Tushal reads them through the Supabase dashboard (service role bypasses RLS).
*/

CREATE TABLE IF NOT EXISTS enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  business_type text NOT NULL,
  email text NOT NULL,
  requirements text NOT NULL,
  budget text NOT NULL,
  deadline text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_enquiries" ON enquiries;
CREATE POLICY "anon_insert_enquiries"
  ON enquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);