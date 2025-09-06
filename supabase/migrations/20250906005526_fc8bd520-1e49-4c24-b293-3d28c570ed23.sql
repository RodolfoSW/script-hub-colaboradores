-- Re-enable RLS and create proper security policies for baseUsuario table

-- First, re-enable RLS on the table
ALTER TABLE public."baseUsuario" ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to view all data
-- This works with your custom authentication system
CREATE POLICY "Authenticated users can view all data" 
ON public."baseUsuario" 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert data
CREATE POLICY "Authenticated users can insert data" 
ON public."baseUsuario" 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update data
CREATE POLICY "Authenticated users can update data" 
ON public."baseUsuario" 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Allow authenticated users to delete data
CREATE POLICY "Authenticated users can delete data" 
ON public."baseUsuario" 
FOR DELETE 
TO authenticated 
USING (true);

-- Note: These policies allow any authenticated connection to access all data
-- This is suitable for your current custom authentication system
-- For enhanced security, consider implementing Supabase Authentication in the future