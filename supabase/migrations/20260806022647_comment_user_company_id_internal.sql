-- Add comment to prevent PostgREST from exposing user_company_id() as an RPC endpoint
-- This is the recommended Supabase pattern for internal helper functions
COMMENT ON FUNCTION public.user_company_id() IS 'Internal: returns the company_id for the current user. Not meant to be called directly.';
