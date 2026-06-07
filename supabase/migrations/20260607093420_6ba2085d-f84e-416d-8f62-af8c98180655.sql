REVOKE EXECUTE ON FUNCTION public.consume_ai_quota(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_ai_quota(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_ai_quota(integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(integer) TO service_role;