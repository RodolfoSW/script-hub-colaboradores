-- Fix conflicting RLS policies by making them PERMISSIVE
-- Drop existing restrictive policies and recreate as permissive

-- Fix baseUsuario table policies (note the correct case)
DROP POLICY IF EXISTS "Admins can modify all data" ON public."baseUsuario";
DROP POLICY IF EXISTS "Admins can view all data" ON public."baseUsuario";
DROP POLICY IF EXISTS "Users can delete own data only" ON public."baseUsuario";
DROP POLICY IF EXISTS "Users can insert own data only" ON public."baseUsuario";
DROP POLICY IF EXISTS "Users can update own data only" ON public."baseUsuario";
DROP POLICY IF EXISTS "Users can view own data only" ON public."baseUsuario";

-- Create new PERMISSIVE policies for baseUsuario
CREATE POLICY "Users and admins can view data" ON public."baseUsuario"
FOR SELECT TO authenticated
USING (is_admin() OR auth.uid() = user_id);

CREATE POLICY "Users and admins can insert data" ON public."baseUsuario"
FOR INSERT TO authenticated
WITH CHECK (is_admin() OR auth.uid() = user_id);

CREATE POLICY "Users and admins can update data" ON public."baseUsuario"
FOR UPDATE TO authenticated
USING (is_admin() OR auth.uid() = user_id)
WITH CHECK (is_admin() OR auth.uid() = user_id);

CREATE POLICY "Users and admins can delete data" ON public."baseUsuario"
FOR DELETE TO authenticated
USING (is_admin() OR auth.uid() = user_id);

-- Fix profiles table policies
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create new PERMISSIVE policies for profiles
CREATE POLICY "Users and admins can view profiles" ON public.profiles
FOR SELECT TO authenticated
USING (is_admin() OR auth.uid() = user_id);

CREATE POLICY "Only admins can insert profiles" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Users and admins can update profiles" ON public.profiles
FOR UPDATE TO authenticated
USING (is_admin() OR auth.uid() = user_id)
WITH CHECK (is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE TO authenticated
USING (is_admin());