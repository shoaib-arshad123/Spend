-- Let new users sign in immediately after register.
-- Email verification in Profile remains optional (profiles.is_email_verified).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, auth
AS $$
BEGIN
  UPDATE auth.users
  SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
  WHERE id = NEW.id;

  INSERT INTO public.profiles (id, email, name, is_email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;
