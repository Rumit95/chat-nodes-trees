CREATE TABLE public.ai_usage_daily (
  day date NOT NULL DEFAULT current_date PRIMARY KEY,
  count integer NOT NULL DEFAULT 0
);

GRANT ALL ON public.ai_usage_daily TO service_role;

ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;

-- No policies: table is only accessed by trusted server-side code (service role / security-definer fn).

CREATE OR REPLACE FUNCTION public.consume_ai_quota(_max integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_count integer;
BEGIN
  INSERT INTO public.ai_usage_daily (day, count)
  VALUES (current_date, 1)
  ON CONFLICT (day)
  DO UPDATE SET count = public.ai_usage_daily.count + 1
  WHERE public.ai_usage_daily.count < _max
  RETURNING count INTO _new_count;

  -- _new_count is NULL only when the conflict update was skipped (cap reached)
  RETURN _new_count IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consume_ai_quota(integer) TO service_role;