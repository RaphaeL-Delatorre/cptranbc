-- Create trigger to automatically insert into profiles when a user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Manually insert existing users that are missing from profiles
INSERT INTO public.profiles (user_id, nome, email)
SELECT id, COALESCE(raw_user_meta_data ->> 'nome', email), email
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;