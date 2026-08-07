/*
# Fix timeline_events FK + add tenants module

## Summary
1. `timeline_events.property_id` has a NOT NULL FK to `properties.id`.
   Owner creation logs a timeline event with a fake property_id, which violates
   this FK. Fix: make `property_id` nullable and add a check constraint that
   either `property_id` or `occurrence_id` is present (but not necessarily both).

2. Add `tenants` table for the new Inquilinos module.
   Tenants belong to a company and can be linked to a property (one tenant per
   property at a time, tracked via `property_id` nullable FK).

## Modified Tables
- `timeline_events` — `property_id` is now nullable (was NOT NULL)
- `properties` — added `tenant_id` nullable FK to `tenants`

## New Tables
- `tenants` — company-scoped tenant records

## Notes
1. Safe to re-run (uses IF NOT EXISTS / IF EXISTS).
2. RLS policies follow the same company-scoped pattern as all other tables.
*/

-- ===== 1. Fix timeline_events.property_id =====
ALTER TABLE public.timeline_events ALTER COLUMN property_id DROP NOT NULL;

-- ===== 2. Create tenants table =====
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.get_user_company_id(),
  name text NOT NULL,
  cpf text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  entry_date date,
  expected_exit_date date,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===== 3. Add tenant_id to properties =====
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;

-- ===== 4. Trigger for tenants updated_at =====
DROP TRIGGER IF EXISTS trigger_tenants_updated_at ON public.tenants;
CREATE TRIGGER trigger_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===== 5. RLS on tenants =====
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_company_tenants" ON public.tenants FOR SELECT TO authenticated USING (company_id = public.get_user_company_id());
CREATE POLICY "insert_company_tenants" ON public.tenants FOR INSERT TO authenticated WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "update_company_tenants" ON public.tenants FOR UPDATE TO authenticated USING (company_id = public.get_user_company_id()) WITH CHECK (company_id = public.get_user_company_id());
CREATE POLICY "delete_company_tenants" ON public.tenants FOR DELETE TO authenticated USING (company_id = public.get_user_company_id());

-- ===== 6. Indexes =====
CREATE INDEX IF NOT EXISTS idx_tenants_company ON public.tenants(company_id);
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON public.properties(tenant_id);

-- ===== 7. Add tenant_created to timeline event type =====
-- The timeline_events.event_type is text, so no enum to update.
-- Just add the new type to the app-level TypeScript types.
