-- Fix existing accounts stuck without email confirmation
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Confirm a specific user right after signup (client has user id from signUp response)
CREATE OR REPLACE FUNCTION public.confirm_signup_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = auth, public
AS $$
DECLARE
  user_created TIMESTAMPTZ;
BEGIN
  SELECT created_at INTO user_created
  FROM auth.users
  WHERE id = target_user_id;

  IF user_created IS NULL OR user_created < NOW() - INTERVAL '1 day' THEN
    RETURN FALSE;
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = target_user_id AND email_confirmed_at IS NULL;

  RETURN FOUND;
END;
$$;

-- Confirm by email when sign-in is blocked (password was already validated by Auth)
CREATE OR REPLACE FUNCTION public.confirm_unverified_email(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = auth, public
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE lower(email) = lower(check_email)
    AND email_confirmed_at IS NULL;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_signup_user(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_unverified_email(TEXT) TO anon, authenticated;
