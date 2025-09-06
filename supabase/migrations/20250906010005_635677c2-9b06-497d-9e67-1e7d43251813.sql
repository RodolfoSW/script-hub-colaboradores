-- CRITICAL SECURITY FIX: Implement proper user isolation and remove password exposure

-- 1. First, create a proper user profiles table that links to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'agent',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create secure RLS policies for profiles (users can only see their own data)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Update baseUsuario table RLS policies to use proper user isolation
-- Remove the overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all data" ON public."baseUsuario";
DROP POLICY IF EXISTS "Authenticated users can insert data" ON public."baseUsuario";
DROP POLICY IF EXISTS "Authenticated users can update data" ON public."baseUsuario";
DROP POLICY IF EXISTS "Authenticated users can delete data" ON public."baseUsuario";

-- 6. Add a user_id column to baseUsuario to link data to authenticated users
ALTER TABLE public."baseUsuario" 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 7. Create secure RLS policies that only allow users to see their own data
CREATE POLICY "Users can view own data only" 
ON public."baseUsuario" 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data only" 
ON public."baseUsuario" 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own data only" 
ON public."baseUsuario" 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own data only" 
ON public."baseUsuario" 
FOR DELETE 
USING (auth.uid() = user_id);

-- 8. Create admin function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Add admin policies for administrative access
CREATE POLICY "Admins can view all data" 
ON public."baseUsuario" 
FOR SELECT 
USING (public.is_admin());

CREATE POLICY "Admins can modify all data" 
ON public."baseUsuario" 
FOR ALL 
USING (public.is_admin());

-- 10. Remove sensitive password column and other unnecessary user fields from baseUsuario
-- These should not be stored in this table anymore since we're using Supabase Auth
ALTER TABLE public."baseUsuario" DROP COLUMN IF EXISTS "Senha";
ALTER TABLE public."baseUsuario" DROP COLUMN IF EXISTS "Nome de usuário";
ALTER TABLE public."baseUsuario" DROP COLUMN IF EXISTS "Nome completo";
ALTER TABLE public."baseUsuario" DROP COLUMN IF EXISTS "Cargo";