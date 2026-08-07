/*
# Multi-tenant SaaS migration: LogImobi

## Summary
Transforms the single-tenant prototype into a multi-tenant SaaS where multiple
imobiliárias (companies) share the same app with complete data isolation.

## New Tables
- `companies` — tenant entity (name, slug, contact, plan)
- `company_members` — links auth.users to a company with a role (admin/gestor/atendente)
- `invites` — pending email invitations (for future user onboarding)
- `import_jobs` — placeholder table for future CSV/Excel import functionality

## Modified Tables
- `owners`, `properties`, `occurrences`, `attachments`, `comments`, `timeline_events`
  — all get `company_id uuid NOT NULL DEFAULT get_user_company_id()` for isolation
- `comments` — added `updated_at`, `edited`, `user_id` for edit functionality
- `timeline_events` — added `user_id` for audit trail

## Security
- All RLS policies replaced with company-scoped predicates:
  `company_id = get_user_company_id()` — users can only see/modify their own company's data
- `get_user_company_id()` and `get_user_company_role()` are SECURITY DEFINER functions
- Storage bucket `attachments` created with company-scoped policies
- Trigger on `auth.users` auto-creates a company + admin membership on signup

## Notes
1. Existing tables had 0 rows, so adding NOT NULL columns with defaults is safe.
2. The `update_updated_at()` function already exists (search_path pinned in prior migration).
3. Each new signup creates a new company automatically — the user becomes its admin.
4. Storage paths follow `{company_id}/{occurrence_id}/{filename}` format.
*/

-- ===== 1. Create companies table =====
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  plan text NOT NULL DEFAULT 'free',
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===== 2. Create company_members table =====
CREATE TABLE IF NOT EXISTS public.company_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'atendente',
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- ===== 3. Helper functions (SECURITY DEFINER) — must exist before tables that reference them =====
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_company_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.company_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ===== 4. Create invites table (for future user onboarding) =====
CREATE TABLE IF NOT EXISTS public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'atendente',
  created_at timestamptz DEFAULT now()
);

-- ===== 5. Create import_jobs table (for future CSV/Excel import) =====
CREATE TABLE IF NOT EXISTS public.import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.get_user_company_id(),
  user_id uuid REFERENCES auth.users(id),
  entity_type text NOT NULL DEFAULT 'owners',
  status text NOT NULL DEFAULT 'pending',
  file_name text DEFAULT '',
  total_rows int DEFAULT 0,
  processed_rows int DEFAULT 0,
  error_message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===== 6. Add company_id to all existing tables =====
ALTER TABLE public.owners ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.occurrences ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.timeline_events ADD COLUMN IF NOT EXISTS company_id uuid;

-- Set defaults (auto-fill from authenticated user's company)
ALTER TABLE public.owners ALTER COLUMN company_id SET DEFAULT public.get_user_company_id();
ALTER TABLE public.properties ALTER COLUMN company_id SET DEFAULT public.get_user_company_id();
ALTER TABLE public.occurrences ALTER COLUMN company_id SET DEFAULT public.get_user_company_id();
ALTER TABLE public.attachments ALTER COLUMN company_id SET DEFAULT public.get_user_company_id();
ALTER TABLE public.comments ALTER COLUMN company_id SET DEFAULT public.get_user_company_id();
ALTER TABLE public.timeline_events ALTER COLUMN company_id SET DEFAULT public.get_user_company_id();

-- Set NOT NULL (safe — all tables have 0 rows)
ALTER TABLE public.owners ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.properties ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.occurrences ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.attachments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.comments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.timeline_events ALTER COLUMN company_id SET NOT NULL;

-- ===== 7. Add columns to comments for edit functionality =====
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS edited boolean NOT NULL DEFAULT false;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- ===== 8. Add user_id to timeline_events for audit trail =====
ALTER TABLE public.timeline_events ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- ===== 9. Add triggers for updated_at =====
DROP TRIGGER IF EXISTS trigger_comments_updated_at ON public.comments;
CREATE TRIGGER trigger_comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trigger_companies_updated_at ON public.companies;
CREATE TRIGGER trigger_companies_updated_at BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 10. Drop ALL old policies =====
-- owners
DROP POLICY IF EXISTS "authenticated_select_owners" ON public.owners;
DROP POLICY IF EXISTS "authenticated_insert_owners" ON public.owners;
DROP POLICY IF EXISTS "authenticated_update_owners" ON public.owners;
DROP POLICY IF EXISTS "authenticated_delete_owners" ON public.owners;
-- properties
DROP POLICY IF EXISTS "authenticated_select_properties" ON public.properties;
DROP POLICY IF EXISTS "authenticated_insert_properties" ON public.properties;
DROP POLICY IF EXISTS "authenticated_update_properties" ON public.properties;
DROP POLICY IF EXISTS "authenticated_delete_properties" ON public.properties;
-- occurrences
DROP POLICY IF EXISTS "authenticated_select_occurrences" ON public.occurrences;
DROP POLICY IF EXISTS "authenticated_insert_occurrences" ON public.occurrences;
DROP POLICY IF EXISTS "authenticated_update_occurrences" ON public.occurrences;
DROP POLICY IF EXISTS "authenticated_delete_occurrences" ON public.occurrences;
-- attachments
DROP POLICY IF EXISTS "authenticated_select_attachments" ON public.attachments;
DROP POLICY IF EXISTS "authenticated_insert_attachments" ON public.attachments;
DROP POLICY IF EXISTS "authenticated_delete_attachments" ON public.attachments;
-- comments
DROP POLICY IF EXISTS "authenticated_select_comments" ON public.comments;
DROP POLICY IF EXISTS "authenticated_insert_comments" ON public.comments;
DROP POLICY IF EXISTS "authenticated_delete_comments" ON public.comments;
-- timeline_events
DROP POLICY IF EXISTS "authenticated_select_timeline_events" ON public.timeline_events;
DROP POLICY IF EXISTS "authenticated_insert_timeline_events" ON public.timeline_events;
DROP POLICY IF EXISTS "authenticated_delete_timeline_events" ON public.timeline_events;

-- ===== 11. Create new company-scoped RLS policies =====
-- owners
CREATE POLICY "select_company_owners" ON public.owners FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "insert_company_owners" ON public.owners FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "update_company_owners" ON public.owners FOR UPDATE TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "delete_company_owners" ON public.owners FOR DELETE TO authenticated USING (company_id = public.get_user_company_id());
-- properties
CREATE POLICY "select_company_properties" ON public.properties FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "insert_company_properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "update_company_properties" ON public.properties FOR UPDATE TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "delete_company_properties" ON public.properties FOR DELETE TO authenticated USING (company_id = public.get_user_company_id());
-- occurrences
CREATE POLICY "select_company_occurrences" ON public.occurrences FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "insert_company_occurrences" ON public.occurrences FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "update_company_occurrences" ON public.occurrences FOR UPDATE TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "delete_company_occurrences" ON public.occurrences FOR DELETE TO authenticated USING (company_id = public.get_user_company_id());
-- attachments
CREATE POLICY "select_company_attachments" ON public.attachments FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "insert_company_attachments" ON public.attachments FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "delete_company_attachments" ON public.attachments FOR DELETE TO authenticated USING (company_id = public.get_user_company_id());
-- comments
CREATE POLICY "select_company_comments" ON public.comments FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "insert_company_comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "update_company_comments" ON public.comments FOR UPDATE TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "delete_company_comments" ON public.comments FOR DELETE TO authenticated USING (company_id = public.get_user_company_id());
-- timeline_events
CREATE POLICY "select_company_timeline" ON public.timeline_events FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "insert_company_timeline" ON public.timeline_events FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "delete_company_timeline" ON public.timeline_events FOR DELETE TO authenticated USING (company_id = public.get_user_company_id());

-- ===== 12. RLS on companies, company_members, invites, import_jobs =====
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_company" ON public.companies FOR SELECT TO authenticated USING (id = public.get_user_company_id());
CREATE POLICY "update_own_company" ON public.companies FOR UPDATE TO authenticated USING (id = public.get_user_company_id()) WITH CHECK (id = public.get_user_company_id());

ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_company_members" ON public.company_members FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "insert_own_company_members" ON public.company_members FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "update_own_company_members" ON public.company_members FOR UPDATE TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "delete_own_company_members" ON public.company_members FOR DELETE TO authenticated USING (company_id = public.get_user_company_id());

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_invites" ON public.invites FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "insert_own_invites" ON public.invites FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "delete_own_invites" ON public.invites FOR DELETE TO authenticated USING (company_id = public.get_user_company_id());

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_import_jobs" ON public.import_jobs FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "insert_own_import_jobs" ON public.import_jobs FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "update_own_import_jobs" ON public.import_jobs FOR UPDATE TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());

-- ===== 13. Trigger on auth.users: auto-create company + admin membership =====
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_company_id uuid;
  company_name text;
  company_slug text;
BEGIN
  company_name := COALESCE(initcap(split_part(NEW.email, '@', 1)), 'Minha Imobiliária');
  company_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8);

  INSERT INTO public.companies (name, slug, email)
  VALUES (company_name, company_slug, COALESCE(NEW.email, ''))
  RETURNING id INTO new_company_id;

  INSERT INTO public.company_members (company_id, user_id, role)
  VALUES (new_company_id, NEW.id, 'admin');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- ===== 14. Create storage bucket =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', false)
ON CONFLICT (id) DO NOTHING;

-- ===== 15. Storage RLS policies (company-scoped paths) =====
CREATE POLICY "select_company_storage" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attachments' AND split_part(name, '/', 1) = public.get_user_company_id()::text);

CREATE POLICY "insert_company_storage" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments' AND split_part(name, '/', 1) = public.get_user_company_id()::text);

CREATE POLICY "update_company_storage" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'attachments' AND split_part(name, '/', 1) = public.get_user_company_id()::text)
  WITH CHECK (bucket_id = 'attachments' AND split_part(name, '/', 1) = public.get_user_company_id()::text);

CREATE POLICY "delete_company_storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'attachments' AND split_part(name, '/', 1) = public.get_user_company_id()::text);

-- ===== 16. Indexes for performance =====
CREATE INDEX IF NOT EXISTS idx_owners_company ON public.owners(company_id);
CREATE INDEX IF NOT EXISTS idx_properties_company ON public.properties(company_id);
CREATE INDEX IF NOT EXISTS idx_properties_owner ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_company ON public.occurrences(company_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_property ON public.occurrences(property_id);
CREATE INDEX IF NOT EXISTS idx_attachments_company ON public.attachments(company_id);
CREATE INDEX IF NOT EXISTS idx_attachments_occurrence ON public.attachments(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_comments_company ON public.comments(company_id);
CREATE INDEX IF NOT EXISTS idx_comments_occurrence ON public.comments(occurrence_id);
CREATE INDEX IF NOT EXISTS idx_timeline_company ON public.timeline_events(company_id);
CREATE INDEX IF NOT EXISTS idx_timeline_property ON public.timeline_events(property_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_company_members_company ON public.company_members(company_id);
