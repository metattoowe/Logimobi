/*
# Add user info columns to company_members

## Summary
The frontend cannot use supabase.auth.admin (requires service role key).
We add `email` and `name` columns to `company_members` so the Users page
can display member info without joining to auth.users.

## Modified Tables
- `company_members` — added `email text NOT NULL DEFAULT ''` and `name text NOT NULL DEFAULT ''`

## Notes
1. The signup trigger already inserts into company_members — we update it to
   also store the user's email and name.
2. Safe to run multiple times (IF NOT EXISTS).
*/

ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
ALTER TABLE public.company_members ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';

-- Update the signup trigger to populate email/name
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
  user_name text;
BEGIN
  user_name := COALESCE((NEW.raw_user_meta_data->>'name'), initcap(split_part(NEW.email, '@', 1)), 'Usuário');
  company_name := COALESCE((NEW.raw_user_meta_data->>'company_name'), user_name || ' Imobiliária');
  company_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8);

  INSERT INTO public.companies (name, slug, email)
  VALUES (company_name, company_slug, COALESCE(NEW.email, ''))
  RETURNING id INTO new_company_id;

  INSERT INTO public.company_members (company_id, user_id, role, email, name)
  VALUES (new_company_id, NEW.id, 'admin', COALESCE(NEW.email, ''), user_name);

  RETURN NEW;
END;
$$;
