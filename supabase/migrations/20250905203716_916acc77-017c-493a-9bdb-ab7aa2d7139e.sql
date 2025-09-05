-- Temporarily disable RLS policies to allow custom login system to work
-- We'll re-enable them when proper Supabase auth is implemented

DROP POLICY IF EXISTS "Users can view own data" ON public."baseUsuario";
DROP POLICY IF EXISTS "Users can insert own data" ON public."baseUsuario";
DROP POLICY IF EXISTS "Users can update own data" ON public."baseUsuario";
DROP POLICY IF EXISTS "Users can delete own data" ON public."baseUsuario";

-- Disable RLS temporarily to allow the current custom login system to work
ALTER TABLE public."baseUsuario" DISABLE ROW LEVEL SECURITY;