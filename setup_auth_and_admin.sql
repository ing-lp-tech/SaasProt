-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, role)
    VALUES (new.id, new.email, 'user');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update or Insert 'owner' role for a specific email (Replace with your email)
-- This tries to find the user in auth.users and updates their profile.
-- If you haven't signed up yet, this part won't work until you do.
DO $$
DECLARE
    target_email TEXT := 'ing.lp.tech@gmail.com'; -- ESTE SERÁ TU EMAIL MAESTRO
    user_record RECORD;
BEGIN
    SELECT * INTO user_record FROM auth.users WHERE email = target_email;
    
    IF user_record.id IS NOT NULL THEN
        INSERT INTO public.user_profiles (id, email, role)
        VALUES (user_record.id, target_email, 'owner')
        ON CONFLICT (id) DO UPDATE SET role = 'owner';
    END IF;
END $$;
