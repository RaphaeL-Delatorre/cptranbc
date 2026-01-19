-- CTB articles table
CREATE TABLE IF NOT EXISTS public.ctb_artigos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria text NOT NULL,
  artigo text NOT NULL,
  descricao text NOT NULL,
  multa boolean NOT NULL DEFAULT false,
  retencao boolean NOT NULL DEFAULT false,
  remocao boolean NOT NULL DEFAULT false,
  apreensao boolean NOT NULL DEFAULT false,
  revogacao boolean NOT NULL DEFAULT false,
  prisao boolean NOT NULL DEFAULT false,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (categoria, artigo)
);

ALTER TABLE public.ctb_artigos ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view CTB articles" ON public.ctb_artigos;
CREATE POLICY "Anyone can view CTB articles"
ON public.ctb_artigos
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins can insert CTB articles" ON public.ctb_artigos;
CREATE POLICY "Admins can insert CTB articles"
ON public.ctb_artigos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update CTB articles" ON public.ctb_artigos;
CREATE POLICY "Admins can update CTB articles"
ON public.ctb_artigos
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete CTB articles" ON public.ctb_artigos;
CREATE POLICY "Admins can delete CTB articles"
ON public.ctb_artigos
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- updated_at trigger
DROP TRIGGER IF EXISTS update_ctb_artigos_updated_at ON public.ctb_artigos;
CREATE TRIGGER update_ctb_artigos_updated_at
BEFORE UPDATE ON public.ctb_artigos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial 16 articles (idempotent)
INSERT INTO public.ctb_artigos (categoria, artigo, descricao, multa, retencao, remocao, apreensao, revogacao, prisao)
VALUES
  ('Documentação', '162', 'Dirigir Sem Habilitação', true, true, true, true, false, false),
  ('Documentação', '230', 'Conduzir Veículo com as taxas atrasadas', true, true, true, true, false, false),
  ('Documentação', '311', 'Clonagem de Placa', true, true, true, true, false, false),
  ('Estacionamento', '1', 'Pousar em local proibido ou sem designação', true, true, true, false, false, false),
  ('Estacionamento', '2', 'Manobra imprudente com aeronave', true, true, true, false, false, false),
  ('Estacionamento', '180', 'Falta de combustível em vias', true, true, true, false, false, false),
  ('Estacionamento', '181', 'Estacionar em local proibido', true, true, true, false, false, false),
  ('Estacionamento', '24', 'Veículo abandonado', true, true, true, false, false, false),
  ('Flagrantes', '244-A', 'Conduzir motocicleta sem usar capacete', true, true, true, false, false, false),
  ('Flagrantes', '244-B', 'Conduzir motocicleta fazendo malabarismo', true, true, true, false, true, false),
  ('Flagrantes', '218', 'Alta velocidade', true, false, false, false, false, false),
  ('Flagrantes', '175', 'Direção Perigosa', true, true, true, false, false, false),
  ('Flagrantes', '186', 'Trafegar na contra-mão', true, true, true, false, false, false),
  ('Flagrantes', '225', 'Praticar corrida ilegal', true, true, true, true, true, false),
  ('Contra a Vida', '135', 'Omissão de socorro', true, true, true, false, false, true),
  ('Contra a Vida', '210', 'Ultrapassar blitz', true, true, true, false, false, true)
ON CONFLICT (categoria, artigo) DO NOTHING;