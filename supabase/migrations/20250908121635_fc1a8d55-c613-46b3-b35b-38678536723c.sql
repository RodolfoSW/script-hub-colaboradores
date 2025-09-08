-- Atualizar RLS policies para permitir apenas admins criarem usuários
-- Remover políticas de INSERT existentes para profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Criar nova política: apenas admins podem inserir profiles
CREATE POLICY "Only admins can insert profiles" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (is_admin());

-- Permitir que admins vejam todos os profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (is_admin() OR auth.uid() = user_id);

-- Permitir que admins atualizem todos os profiles  
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (is_admin() OR auth.uid() = user_id);

-- Permitir que admins deletem profiles
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (is_admin());