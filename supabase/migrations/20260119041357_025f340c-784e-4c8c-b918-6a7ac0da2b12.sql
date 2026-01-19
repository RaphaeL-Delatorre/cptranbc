-- Switch CTB ordering to global (not per category)

-- Reinitialize ordem globally using current (categoria, ordem, artigo) as deterministic base
WITH ranked AS (
  SELECT id,
         row_number() OVER (ORDER BY categoria ASC, ordem ASC, artigo ASC, created_at ASC) - 1 AS rn
  FROM public.ctb_artigos
)
UPDATE public.ctb_artigos c
SET ordem = r.rn
FROM ranked r
WHERE c.id = r.id;

-- Replace index
DROP INDEX IF EXISTS public.idx_ctb_artigos_categoria_ordem;
CREATE INDEX IF NOT EXISTS idx_ctb_artigos_ordem
ON public.ctb_artigos (ordem);
