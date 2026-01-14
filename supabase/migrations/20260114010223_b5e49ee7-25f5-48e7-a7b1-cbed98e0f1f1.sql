-- Add viatura, ponto_discord and aprovador_nome columns to pontos_eletronicos
ALTER TABLE public.pontos_eletronicos 
ADD COLUMN IF NOT EXISTS viatura text,
ADD COLUMN IF NOT EXISTS ponto_discord text,
ADD COLUMN IF NOT EXISTS aprovador_nome text;

-- Add aprovador_nome to aits table as well
ALTER TABLE public.aits
ADD COLUMN IF NOT EXISTS aprovador_nome text;