/*
# Fix signup trigger: replace gen_random_bytes with gen_random_uuid

## Summary
The `handle_new_user_signup()` trigger used `gen_random_bytes(4)` to generate
a unique slug suffix. The `pgcrypto` extension provides `gen_random_bytes`,
but the function's `search_path` is set to `public, pg_temp` — which excludes
the `pgcrypto` schema, causing a "function does not exist" error during
signup. Replacing it with `gen_random_uuid()` (built-in, no extension
needed) fixes the issue.

## Functions modified
- `public.handle_new_user_signup()` — uses `gen_random_uuid()` for slug uniqueness

## Notes
1. `gen_random_uuid()` returns a full UUID; we take the first 8 chars of the
   hex representation as the slug suffix.
2. Safe to re-run.
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
  company_slug := lower(regexp_replace(company_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(encode(gen_random_uuid()::bytea, 'hex'), 1, 8);

  INSERT INTO public.companies (name, slug, email)
  VALUES (company_name, company_slug, COALESCE(NEW.email, ''))
  RETURNING id INTO new_company_id;

  INSERT INTO public.company_members (company_id, user_id, role, email, name)
  VALUES (new_company_id, NEW.id, 'admin', COALESCE(NEW.email, ''), user_name);

  RETURN NEW;
END;
$$;
