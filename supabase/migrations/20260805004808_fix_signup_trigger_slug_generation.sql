/*
# Fix signup trigger: use md5(random()) for slug suffix

## Summary
Previous attempts used `gen_random_bytes()` (not in search_path) and
`gen_random_uuid()::bytea` (invalid cast). Switch to `md5(random()::text)`
which is always available and produces a hex string we can slice.

## Functions modified
- `public.handle_new_user_signup()` — slug suffix now uses `md5(random()::text)`

## Notes
1. Safe to re-run.
*/

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
  company_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(md5(random()::text), 1, 8);

  INSERT INTO public.companies (name, slug, email)
  VALUES (company_name, company_slug, COALESCE(NEW.email, ''))
  RETURNING id INTO new_company_id;

  INSERT INTO public.company_members (company_id, user_id, role, email, name)
  VALUES (new_company_id, NEW.id, 'admin', COALESCE(NEW.email, ''), user_name);

  RETURN NEW;
END;
$$;
