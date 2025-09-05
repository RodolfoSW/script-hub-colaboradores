-- Create RLS policies for baseUsuario table to protect sensitive user data

-- Allow users to view only their own data (using auth.uid())
CREATE POLICY "Users can view own data" 
ON public."baseUsuario" 
FOR SELECT 
USING (auth.uid()::text = "Nome de usuário");

-- Allow users to insert their own data
CREATE POLICY "Users can insert own data" 
ON public."baseUsuario" 
FOR INSERT 
WITH CHECK (auth.uid()::text = "Nome de usuário");

-- Allow users to update their own data
CREATE POLICY "Users can update own data" 
ON public."baseUsuario" 
FOR UPDATE 
USING (auth.uid()::text = "Nome de usuário")
WITH CHECK (auth.uid()::text = "Nome de usuário");

-- Allow users to delete their own data
CREATE POLICY "Users can delete own data" 
ON public."baseUsuario" 
FOR DELETE 
USING (auth.uid()::text = "Nome de usuário");

-- Create a function to check if user is admin (for future admin functionality)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- This is a placeholder - you'll need to implement proper admin role checking
  -- For now, return false to ensure security
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policy (currently disabled for security - enable when admin system is implemented)
-- CREATE POLICY "Admins can view all data" 
-- ON public."baseUsuario" 
-- FOR ALL 
-- USING (public.is_admin());