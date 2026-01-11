-- Add patente and nome_policial columns to pontos_eletronicos
ALTER TABLE public.pontos_eletronicos 
ADD COLUMN IF NOT EXISTS patente TEXT,
ADD COLUMN IF NOT EXISTS nome_policial TEXT;