-- Revoke EXECUTE on user_company_id() from anon and public to fix security warnings
-- Only authenticated needs it (for RLS policy evaluation)
REVOKE EXECUTE ON FUNCTION public.user_company_id() FROM anon, public;
-- Ensure authenticated still has it
GRANT EXECUTE ON FUNCTION public.user_company_id() TO authenticated;
