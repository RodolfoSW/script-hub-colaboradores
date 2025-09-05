-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- This is a placeholder - you'll need to implement proper admin role checking
  -- For now, return false to ensure security
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;