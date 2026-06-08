-- Helper to check if email is registered (for friendly login error messages)
CREATE OR REPLACE FUNCTION public.email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE LOWER(email) = LOWER(check_email)
  );
$$;

GRANT EXECUTE ON FUNCTION public.email_exists(TEXT) TO anon, authenticated;
