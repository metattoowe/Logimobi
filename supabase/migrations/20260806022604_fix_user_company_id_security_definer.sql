-- Step 1: Change user_company_id() to SECURITY DEFINER to fix infinite recursion
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT company_id FROM public.company_members WHERE user_id = auth.uid() LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.user_company_id() TO authenticated;

-- Step 2: Migrate import_jobs and storage policies to use user_company_id() instead of get_user_company_id()

-- Fix import_jobs default
ALTER TABLE public.import_jobs ALTER COLUMN company_id SET DEFAULT public.user_company_id();

-- Drop and recreate import_jobs policies
DROP POLICY IF EXISTS select_own_import_jobs ON public.import_jobs;
DROP POLICY IF EXISTS insert_own_import_jobs ON public.import_jobs;
DROP POLICY IF EXISTS update_own_import_jobs ON public.import_jobs;

CREATE POLICY "select_own_import_jobs" ON public.import_jobs FOR SELECT TO authenticated USING (company_id = public.user_company_id());
CREATE POLICY "insert_own_import_jobs" ON public.import_jobs FOR INSERT TO authenticated WITH CHECK (company_id = public.user_company_id());
CREATE POLICY "update_own_import_jobs" ON public.import_jobs FOR UPDATE TO authenticated USING (company_id = public.user_company_id()) WITH CHECK (company_id = public.user_company_id());

-- Fix storage policies
DROP POLICY IF EXISTS select_company_storage ON storage.objects;
DROP POLICY IF EXISTS insert_company_storage ON storage.objects;
DROP POLICY IF EXISTS update_company_storage ON storage.objects;
DROP POLICY IF EXISTS delete_company_storage ON storage.objects;

CREATE POLICY "select_company_storage" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'attachments');
CREATE POLICY "insert_company_storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "update_company_storage" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'attachments');
CREATE POLICY "delete_company_storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'attachments');

-- Now safe to drop the old function
DROP FUNCTION IF EXISTS public.get_user_company_id();
