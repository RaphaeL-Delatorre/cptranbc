-- Add ordering column for CTB articles
ALTER TABLE public.ctb_artigos
ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0;

-- Initialize ordem for existing rows (per category, ordered by artigo)
WITH ranked AS (
  SELECT id,
         row_number() OVER (PARTITION BY categoria ORDER BY artigo ASC, created_at ASC) - 1 AS rn
  FROM public.ctb_artigos
)
UPDATE public.ctb_artigos c
SET ordem = r.rn
FROM ranked r
WHERE c.id = r.id;

-- Helpful index for ordered reads
CREATE INDEX IF NOT EXISTS idx_ctb_artigos_categoria_ordem
ON public.ctb_artigos (categoria, ordem);
