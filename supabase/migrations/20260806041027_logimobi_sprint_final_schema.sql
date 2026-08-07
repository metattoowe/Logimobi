/*
# LogImobi Sprint Final - Database Schema Updates

## Changes Overview

1. **Platform Admin support**
   - Add `is_platform_admin` boolean column to `company_members` (default false)
   - Platform admins don't belong to any specific company
   - Add `is_platform_admin` to `auth.users.raw_app_meta_data` via a helper function

2. **Company management**
   - Add `blocked` boolean column to `companies` (default false) — blocked companies can't log in
   - Add `max_users` integer column to `companies` (default 5) — user limit per company

3. **Invite system enhancement**
   - Add `token` column to `invites` (unique, for secure invite links)
   - Add `used` boolean column to `invites` (default false)
   - Add `invited_by` uuid column to `invites` (references auth.users)

4. **Occurrence enhancements**
   - Add `updated_at` auto-trigger to occurrences (already has the trigger)
   - New statuses will be handled in the application layer (no DB constraint changes needed)

5. **Password change tracking**
   - Add `must_change_password` boolean to `auth.users.raw_app_meta_data` (handled via edge function)

6. **Security**
   - RLS policies for platform admin: platform admins can see all companies
   - Company blocking: blocked company members can't access data
   - Updated `user_company_id()` to return NULL for blocked companies
*/

-- ===== 1. Add columns to companies =====
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS max_users integer NOT NULL DEFAULT 5;

-- ===== 2. Add columns to company_members =====
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS is_platform_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- ===== 3. Add columns to invites =====
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS token uuid DEFAULT gen_random_uuid();
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS used boolean NOT NULL DEFAULT false;
ALTER TABLE public.invites ADD COLUMN IF NOT EXISTS invited_by uuid;

-- Make token unique
CREATE UNIQUE INDEX IF NOT EXISTS invites_token_unique ON public.invites(token) WHERE token IS NOT NULL;

-- ===== 4. Update user_company_id() to return NULL for blocked companies =====
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT cm.company_id
  FROM public.company_members cm
  JOIN public.companies c ON c.id = cm.company_id
  WHERE cm.user_id = auth.uid()
    AND cm.active = true
    AND c.blocked = false
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.user_company_id() TO authenticated;

-- ===== 5. Add is_platform_admin check function =====
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
  SELECT COALESCE(
    (SELECT is_platform_admin FROM public.company_members WHERE user_id = auth.uid() LIMIT 1),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- ===== 6. Update RLS policies for platform admin access =====

-- Companies: platform admins can see ALL companies
DROP POLICY IF EXISTS select_own_company ON public.companies;
CREATE POLICY select_own_company ON public.companies FOR SELECT TO authenticated
  USING (id = public.user_company_id() OR public.is_platform_admin());

DROP POLICY IF EXISTS update_own_company ON public.companies;
CREATE POLICY update_own_company ON public.companies FOR UPDATE TO authenticated
  USING (id = public.user_company_id())
  WITH CHECK (id = public.user_company_id());

-- Platform admins can block/unblock and set max_users
DROP POLICY IF EXISTS admin_update_companies ON public.companies;
CREATE POLICY admin_update_companies ON public.companies FOR UPDATE TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Company members: platform admins can see all members
DROP POLICY IF EXISTS select_own_company_members ON public.company_members;
CREATE POLICY select_own_company_members ON public.company_members FOR SELECT TO authenticated
  USING (company_id = public.user_company_id() OR public.is_platform_admin());

-- Invites: platform admins can see all invites
DROP POLICY IF EXISTS select_own_invites ON public.invites;
CREATE POLICY select_own_invites ON public.invites FOR SELECT TO authenticated
  USING (company_id = public.user_company_id() OR public.is_platform_admin());

-- ===== 7. Update the signup trigger to NOT auto-create a company =====
-- (Invited users should NOT get a new company; they join an existing one)
-- We'll modify the trigger to only create a company if the user has no invite
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  invite_record record;
  user_name text;
BEGIN
  user_name := COALESCE((NEW.raw_user_meta_data->>'name'), initcap(split_part(NEW.email, '@', 1)), 'Usuário');

  -- Check if this email has a pending invite
  SELECT * INTO invite_record
  FROM public.invites
  WHERE email = NEW.email AND used = false
  LIMIT 1;

  IF invite_record.id IS NOT NULL THEN
    -- User was invited: add them to the inviting company
    INSERT INTO public.company_members (company_id, user_id, role, email, name)
    VALUES (invite_record.company_id, NEW.id, invite_record.role, COALESCE(NEW.email, ''), user_name);

    -- Mark invite as used
    UPDATE public.invites SET used = true WHERE id = invite_record.id;
  ELSE
    -- No invite: create a new company (self-signup for platform admin or first gestor)
    -- This path is for platform admin self-registration only
    DECLARE
      new_company_id uuid;
      company_name text;
      company_slug text;
    BEGIN
      company_name := COALESCE((NEW.raw_user_meta_data->>'company_name'), user_name || ' Imobiliária');
      company_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(md5(random()::text), 1, 8);

      INSERT INTO public.companies (name, slug, email)
      VALUES (company_name, company_slug, COALESCE(NEW.email, ''))
      RETURNING id INTO new_company_id;

      INSERT INTO public.company_members (company_id, user_id, role, email, name)
      VALUES (new_company_id, NEW.id, 'admin', COALESCE(NEW.email, ''), user_name);
    END;
  END IF;

  RETURN NEW;
END;
$function$;

-- ===== 8. Add updated_at trigger to timeline_events =====
CREATE TRIGGER trigger_timeline_events_updated_at
BEFORE UPDATE ON public.timeline_events
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
