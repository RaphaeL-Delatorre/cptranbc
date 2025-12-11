-- Create gallery_images table for homepage gallery
CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view gallery images
CREATE POLICY "Anyone can view gallery images"
ON public.gallery_images FOR SELECT
USING (true);

-- Admins and moderators can manage gallery images
CREATE POLICY "Admins and moderators can insert gallery images"
ON public.gallery_images FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderador'));

CREATE POLICY "Admins and moderators can update gallery images"
ON public.gallery_images FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderador'));

CREATE POLICY "Admins and moderators can delete gallery images"
ON public.gallery_images FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderador'));

-- Create regulamentos table
CREATE TABLE public.regulamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  documento_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regulamentos ENABLE ROW LEVEL SECURITY;

-- Anyone can view regulamentos
CREATE POLICY "Anyone can view regulamentos"
ON public.regulamentos FOR SELECT
USING (true);

-- Admins and moderators can manage regulamentos
CREATE POLICY "Admins and moderators can insert regulamentos"
ON public.regulamentos FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderador'));

CREATE POLICY "Admins and moderators can update regulamentos"
ON public.regulamentos FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderador'));

CREATE POLICY "Admins and moderators can delete regulamentos"
ON public.regulamentos FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderador'));

-- Create site_settings table for about page and other site content
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view site settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings FOR SELECT
USING (true);

-- Admins and moderators can manage site settings
CREATE POLICY "Admins and moderators can insert site settings"
ON public.site_settings FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderador'));

CREATE POLICY "Admins and moderators can update site settings"
ON public.site_settings FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderador'));

CREATE POLICY "Admins and moderators can delete site settings"
ON public.site_settings FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderador'));

-- Add updated_at triggers
CREATE TRIGGER update_gallery_images_updated_at
BEFORE UPDATE ON public.gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_regulamentos_updated_at
BEFORE UPDATE ON public.regulamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default site settings for about page
INSERT INTO public.site_settings (key, value) VALUES 
('about_page', '{
  "title": "Sobre o Departamento de Trânsito",
  "subtitle": "Compromisso com a segurança e o bem-estar da comunidade",
  "mission_title": "Nossa Missão",
  "mission_text": "O Departamento de Trânsito tem como missão garantir a ordem pública e a segurança dos cidadãos através do policiamento ostensivo e preventivo, atuando com profissionalismo, ética e respeito aos direitos humanos.",
  "vision_title": "Nossa Visão",
  "vision_text": "Ser reconhecido como referência em policiamento ostensivo, através da excelência operacional, inovação tecnológica e proximidade com a comunidade, promovendo um ambiente seguro e pacífico para todos os cidadãos.",
  "values": [
    {"title": "Disciplina", "description": "Cumprimento rigoroso das normas e regulamentos com profissionalismo e responsabilidade."},
    {"title": "Hierarquia", "description": "Respeito à cadeia de comando e às estruturas organizacionais da instituição."},
    {"title": "Integridade", "description": "Conduta ética, honesta e transparente em todas as ações e decisões."},
    {"title": "Coragem", "description": "Enfrentamento de desafios com bravura e determinação para proteger a sociedade."},
    {"title": "Lealdade", "description": "Compromisso com a corporação, os colegas e a população que servimos."},
    {"title": "Respeito", "description": "Tratamento digno e respeitoso a todos os cidadãos e companheiros de farda."}
  ],
  "areas": [
    {"title": "Policiamento Ostensivo", "description": "Patrulhamento preventivo nas ruas, praças e vias públicas para inibir a criminalidade e garantir a sensação de segurança à população."},
    {"title": "Operações Especiais", "description": "Ações direcionadas ao combate do tráfico de drogas, porte ilegal de armas e outros crimes que afetam a segurança pública."},
    {"title": "Atendimento à Comunidade", "description": "Orientação e apoio aos cidadãos em situações de emergência e necessidade de assistência policial."}
  ]
}'::jsonb);

-- Create storage bucket for gallery and site images
INSERT INTO storage.buckets (id, name, public) VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for site-images bucket
CREATE POLICY "Anyone can view site images"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-images');

CREATE POLICY "Admins and moderators can upload site images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-images' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderador')));

CREATE POLICY "Admins and moderators can update site images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-images' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderador')));

CREATE POLICY "Admins and moderators can delete site images"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-images' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderador')));