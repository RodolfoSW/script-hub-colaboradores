-- Add unique constraint to allow upsert operations
ALTER TABLE public."baseUsuario" 
ADD CONSTRAINT unique_username UNIQUE ("Nome de usuário");

-- Also add unique constraints for other fields that are used in upserts
ALTER TABLE public."baseUsuario" 
ADD CONSTRAINT unique_titulo UNIQUE ("Título");

ALTER TABLE public."baseUsuario" 
ADD CONSTRAINT unique_modelo UNIQUE ("Modelo");

ALTER TABLE public."baseUsuario" 
ADD CONSTRAINT unique_protocolo UNIQUE ("Histórico de Protocolos");