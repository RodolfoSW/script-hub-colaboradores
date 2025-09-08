-- Atualizar o usuário admin@email.com para ter role de admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE user_id = '268cb21b-b9b7-48cc-b920-e90218c41abf';