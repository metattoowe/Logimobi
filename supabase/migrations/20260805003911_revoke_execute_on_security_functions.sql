/*
# Revoke EXECUTE on SECURITY DEFINER functions

## Summary
The advisor flagged that `get_user_company_id()`, `get_user_company_role()`,
and `handle_new_user_signup()` are callable by anon/authenticated roles via
the REST API. These functions are used internally by RLS policies and triggers,
not by the frontend. We revoke EXECUTE from public, anon, and authenticated
so they cannot be called directly via /rest/v1/rpc/.

## Notes
1. RLS policies call these functions as the table owner (SECURITY DEFINER),
   so revoking EXECUTE does not break policy evaluation.
2. `handle_new_user_signup` is only called by the auth.users trigger, not by
   any role.
3. Safe to re-run.
*/

REVOKE EXECUTE ON FUNCTION public.get_user_company_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_company_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_signup() FROM PUBLIC, anon, authenticated;
