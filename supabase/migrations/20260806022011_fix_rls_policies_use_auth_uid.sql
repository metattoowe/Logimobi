/*
# Fix all RLS policies to use auth.uid() directly instead of get_user_company_id()
#
# The get_user_company_id() SECURITY DEFINER function returns NULL in some
# contexts. Replace all RLS policies with direct subqueries to company_members
# using auth.uid(). This is more reliable and eliminates the function dependency.
#
# Also fix the column DEFAULTs to use a subquery instead of the function.
*/

-- ===== 1. Drop ALL existing policies on ALL tables =====
DROP POLICY IF EXISTS select_company_owners ON public.owners;
DROP POLICY IF EXISTS insert_company_owners ON public.owners;
DROP POLICY IF EXISTS update_company_owners ON public.owners;
DROP POLICY IF EXISTS delete_company_owners ON public.owners;

DROP POLICY IF EXISTS select_company_properties ON public.properties;
DROP POLICY IF EXISTS insert_company_properties ON public.properties;
DROP POLICY IF EXISTS update_company_properties ON public.properties;
DROP POLICY IF EXISTS delete_company_properties ON public.properties;

DROP POLICY IF EXISTS select_company_tenants ON public.tenants;
DROP POLICY IF EXISTS insert_company_tenants ON public.tenants;
DROP POLICY IF EXISTS update_company_tenants ON public.tenants;
DROP POLICY IF EXISTS delete_company_tenants ON public.tenants;

DROP POLICY IF EXISTS select_company_timeline ON public.timeline_events;
DROP POLICY IF EXISTS insert_company_timeline ON public.timeline_events;
DROP POLICY IF EXISTS delete_company_timeline ON public.timeline_events;

DROP POLICY IF EXISTS select_company_attachments ON public.attachments;
DROP POLICY IF EXISTS insert_company_attachments ON public.attachments;
DROP POLICY IF EXISTS delete_company_attachments ON public.attachments;

DROP POLICY IF EXISTS select_company_comments ON public.comments;
DROP POLICY IF EXISTS insert_company_comments ON public.comments;
DROP POLICY IF EXISTS update_company_comments ON public.comments;
DROP POLICY IF EXISTS delete_company_comments ON public.comments;

DROP POLICY IF EXISTS select_own_company ON public.companies;
DROP POLICY IF EXISTS update_own_company ON public.companies;

DROP POLICY IF EXISTS select_own_company_members ON public.company_members;
DROP POLICY IF EXISTS insert_own_company_members ON public.company_members;
DROP POLICY IF EXISTS update_own_company_members ON public.company_members;
DROP POLICY IF EXISTS delete_own_company_members ON public.company_members;

DROP POLICY IF EXISTS select_own_invites ON public.invites;
DROP POLICY IF EXISTS insert_own_invites ON public.invites;
DROP POLICY IF EXISTS delete_own_invites ON public.invites;

-- Also drop occurrences policies if they exist
DROP POLICY IF EXISTS select_company_occurrences ON public.occurrences;
DROP POLICY IF EXISTS insert_company_occurrences ON public.occurrences;
DROP POLICY IF EXISTS update_company_occurrences ON public.occurrences;
DROP POLICY IF EXISTS delete_company_occurrences ON public.occurrences;

-- ===== 2. Create a helper function that uses auth.uid() directly =====
-- This function is SECURITY INVOKER (not DEFINER) so it runs with the caller's
-- privileges and auth.uid() works correctly in RLS policy context.
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.user_company_id() TO authenticated;

-- ===== 3. Recreate ALL policies using user_company_id() =====

-- --- owners ---
CREATE POLICY "select_company_owners" ON public.owners FOR SELECT TO authenticated USING (company_id = public.user_company_id());
CREATE POLICY "insert_company_owners" ON public.owners FOR INSERT TO authenticated WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "update_company_owners" ON public.owners FOR UPDATE TO authenticated USING (company_id = public.user_company_id()) WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "delete_company_owners" ON public.owners FOR DELETE TO authenticated USING (company_id = public.user_company_id());

-- --- properties ---
CREATE POLICY "select_company_properties" ON public.properties FOR SELECT TO authenticated USING (company_id = public.user_company_id());
CREATE POLICY "insert_company_properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "update_company_properties" ON public.properties FOR UPDATE TO authenticated USING (company_id = public.user_company_id()) WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "delete_company_properties" ON public.properties FOR DELETE TO authenticated USING (company_id = public.user_company_id());

-- --- tenants ---
CREATE POLICY "select_company_tenants" ON public.tenants FOR SELECT TO authenticated USING (company_id = public.user_company_id());
CREATE POLICY "insert_company_tenants" ON public.tenants FOR INSERT TO authenticated WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "update_company_tenants" ON public.tenants FOR UPDATE TO authenticated USING (company_id = public.user_company_id()) WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "delete_company_tenants" ON public.tenants FOR DELETE TO authenticated USING (company_id = public.user_company_id());

-- --- occurrences ---
CREATE POLICY "select_company_occurrences" ON public.occurrences FOR SELECT TO authenticated USING (company_id = public.user_company_id());
CREATE POLICY "insert_company_occurrences" ON public.occurrences FOR INSERT TO authenticated WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "update_company_occurrences" ON public.occurrences FOR UPDATE TO authenticated USING (company_id = public.user_company_id()) WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "delete_company_occurrences" ON public.occurrences FOR DELETE TO authenticated USING (company_id = public.user_company_id());

-- --- timeline_events ---
CREATE POLICY "select_company_timeline" ON public.timeline_events FOR SELECT TO authenticated USING (company_id = public.user_company_id());
CREATE POLICY "insert_company_timeline" ON public.timeline_events FOR INSERT TO authenticated WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "update_company_timeline" ON public.timeline_events FOR UPDATE TO authenticated USING (company_id = public.user_company_id()) WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "delete_company_timeline" ON public.timeline_events FOR DELETE TO authenticated USING (company_id = public.user_company_id());

-- --- attachments ---
CREATE POLICY "select_company_attachments" ON public.attachments FOR SELECT TO authenticated USING (company_id = public.user_company_id());
CREATE POLICY "insert_company_attachments" ON public.attachments FOR INSERT TO authenticated WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "update_company_attachments" ON public.attachments FOR UPDATE TO authenticated USING (company_id = public.user_company_id()) WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "delete_company_attachments" ON public.attachments FOR DELETE TO authenticated USING (company_id = public.user_company_id());

-- --- comments ---
CREATE POLICY "select_company_comments" ON public.comments FOR SELECT TO authenticated USING (company_id = public.user_company_id());
CREATE POLICY "insert_company_comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "update_company_comments" ON public.comments FOR UPDATE TO authenticated USING (company_id = public.user_company_id()) WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "delete_company_comments" ON public.comments FOR DELETE TO authenticated USING (company_id = public.user_company_id());

-- --- companies ---
CREATE POLICY "select_own_company" ON public.companies FOR SELECT TO authenticated USING (id = public.user_company_id());
CREATE POLICY "update_own_company" ON public.companies FOR UPDATE TO authenticated USING (id = public.user_company_id()) WITH CHECK (id = public.user_company_id());

-- --- company_members ---
CREATE POLICY "select_own_company_members" ON public.company_members FOR SELECT TO authenticated USING (company_id = public.user_company_id());
CREATE POLICY "insert_own_company_members" ON public.company_members FOR INSERT TO authenticated WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "update_own_company_members" ON public.company_members FOR UPDATE TO authenticated USING (company_id = public.user_company_id()) WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "delete_own_company_members" ON public.company_members FOR DELETE TO authenticated USING (company_id = public.user_company_id());

-- --- invites ---
CREATE POLICY "select_own_invites" ON public.invites FOR SELECT TO authenticated USING (company_id = public.user_company_id());
CREATE POLICY "insert_own_invites" ON public.invites FOR INSERT TO authenticated WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "delete_own_invites" ON public.invites FOR DELETE TO authenticated USING (company_id = public.user_company_id());

-- ===== 4. Update column DEFAULTs to use the new function =====
ALTER TABLE public.owners ALTER COLUMN company_id SET DEFAULT public.user_company_id();
ALTER TABLE public.properties ALTER COLUMN company_id SET DEFAULT public.user_company_id();
ALTER TABLE public.tenants ALTER COLUMN company_id SET DEFAULT public.user_company_id();
ALTER TABLE public.occurrences ALTER COLUMN company_id SET DEFAULT public.user_company_id();
ALTER TABLE public.timeline_events ALTER COLUMN company_id SET DEFAULT public.user_company_id();
ALTER TABLE public.attachments ALTER COLUMN company_id SET DEFAULT public.user_company_id();
ALTER TABLE public.comments ALTER COLUMN company_id SET DEFAULT public.user_company_id();
