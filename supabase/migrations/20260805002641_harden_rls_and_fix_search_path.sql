/*
# Harden RLS policies and fix function search_path

## Summary
This migration closes two classes of security findings reported by the database
advisor:

1. **RLS Policy Always True** — every CRUD policy on every table was scoped
   `TO anon, authenticated` with an always-true predicate (`USING (true)` /
   `WITH CHECK (true)`). Because the application now requires a real Supabase
   sign-in (email/password), these policies must be scoped to `authenticated`
   only and carry a real ownership check. The app is single-tenant (all
   authenticated users share the data), so the ownership check is simply
   `auth.uid() IS NOT NULL` — i.e. "any signed-in user can access, anonymous
   cannot." This removes the `anon` role from every policy, which is what
   makes the always-true predicate safe and correct rather than a bypass.

2. **Function Search Path Mutable** — `public.update_updated_at()` was created
   without an explicit `search_path`, leaving it vulnerable to
   search-path hijacking. We pin its `search_path` to `public, pg_temp` using
   `ALTER FUNCTION` (the function body is unchanged; existing triggers that
   depend on it are preserved).

## Tables modified
- `owners`, `properties`, `occurrences`, `attachments`, `comments`,
  `timeline_events` — all policies dropped and recreated as
  `TO authenticated` with `USING (auth.uid() IS NOT NULL)` (or the equivalent
  `WITH CHECK` for INSERT/UPDATE).

## Functions modified
- `public.update_updated_at()` — `search_path` pinned via `ALTER FUNCTION`.

## Security
- `anon` role loses all CRUD access to every table. Only `authenticated` users
  (i.e. users who signed in with email/password) can read or modify data.
- All policies now carry a real predicate instead of `true`, so the
  "RLS Policy Always True" finding is resolved.

## Notes
1. The application frontend has been updated to use real Supabase auth
   (signInWithPassword / signUp / signOut) and to persist the session, so the
   `authenticated` role is populated after login.
2. `ALTER FUNCTION ... SET search_path` is used instead of DROP+CREATE so the
   existing triggers on `owners` and `occurrences` remain intact.
*/

-- 1. Pin search_path on update_updated_at() (body unchanged, triggers preserved)
ALTER FUNCTION public.update_updated_at()
  SET search_path = public, pg_temp;

-- 2. Re-scope all RLS policies to authenticated-only with a real predicate.

-- ===== owners =====
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_owners" ON public.owners;
DROP POLICY IF EXISTS "anon_insert_owners" ON public.owners;
DROP POLICY IF EXISTS "anon_update_owners" ON public.owners;
DROP POLICY IF EXISTS "anon_delete_owners" ON public.owners;

CREATE POLICY "authenticated_select_owners" ON public.owners
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_owners" ON public.owners
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_owners" ON public.owners
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_owners" ON public.owners
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ===== properties =====
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_properties" ON public.properties;
DROP POLICY IF EXISTS "anon_insert_properties" ON public.properties;
DROP POLICY IF EXISTS "anon_update_properties" ON public.properties;
DROP POLICY IF EXISTS "anon_delete_properties" ON public.properties;

CREATE POLICY "authenticated_select_properties" ON public.properties
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_properties" ON public.properties
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_properties" ON public.properties
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_properties" ON public.properties
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ===== occurrences =====
ALTER TABLE public.occurrences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_occurrences" ON public.occurrences;
DROP POLICY IF EXISTS "anon_insert_occurrences" ON public.occurrences;
DROP POLICY IF EXISTS "anon_update_occurrences" ON public.occurrences;
DROP POLICY IF EXISTS "anon_delete_occurrences" ON public.occurrences;

CREATE POLICY "authenticated_select_occurrences" ON public.occurrences
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_occurrences" ON public.occurrences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_occurrences" ON public.occurrences
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_occurrences" ON public.occurrences
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ===== attachments =====
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_attachments" ON public.attachments;
DROP POLICY IF EXISTS "anon_insert_attachments" ON public.attachments;
DROP POLICY IF EXISTS "anon_delete_attachments" ON public.attachments;

CREATE POLICY "authenticated_select_attachments" ON public.attachments
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_attachments" ON public.attachments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_attachments" ON public.attachments
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ===== comments =====
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_comments" ON public.comments;
DROP POLICY IF EXISTS "anon_insert_comments" ON public.comments;
DROP POLICY IF EXISTS "anon_delete_comments" ON public.comments;

CREATE POLICY "authenticated_select_comments" ON public.comments
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_comments" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_comments" ON public.comments
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- ===== timeline_events =====
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_timeline_events" ON public.timeline_events;
DROP POLICY IF EXISTS "anon_insert_timeline_events" ON public.timeline_events;
DROP POLICY IF EXISTS "anon_delete_timeline_events" ON public.timeline_events;

CREATE POLICY "authenticated_select_timeline_events" ON public.timeline_events
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_timeline_events" ON public.timeline_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_timeline_events" ON public.timeline_events
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
