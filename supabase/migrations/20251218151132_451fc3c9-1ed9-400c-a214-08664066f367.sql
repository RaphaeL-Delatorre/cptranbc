-- =====================================================
-- SISTEMA DE CARGOS E PERMISSÕES PERSONALIZÁVEIS
-- =====================================================

-- Tabela de cargos personalizáveis
CREATE TABLE public.cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  cor VARCHAR(7) DEFAULT '#FFD700',
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de permissões do sistema
CREATE TABLE public.permissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(100) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de relacionamento cargo-permissões
CREATE TABLE public.cargo_permissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  permissao_id UUID NOT NULL REFERENCES public.permissoes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cargo_id, permissao_id)
);

-- Tabela de relacionamento usuário-cargo (substitui user_roles para cargos customizados)
CREATE TABLE public.usuario_cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cargo_id UUID NOT NULL REFERENCES public.cargos(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, cargo_id)
);

-- =====================================================
-- SISTEMA DE NOTÍCIAS/NOTIFICAÇÕES
-- =====================================================

CREATE TABLE public.noticias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  subtitulo VARCHAR(300),
  descricao TEXT,
  imagem_url TEXT,
  ativa BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- SISTEMA DE PONTO ELETRÔNICO
-- =====================================================

CREATE TYPE public.ponto_status AS ENUM ('ativo', 'pausado', 'finalizado', 'pendente', 'aprovado', 'recusado');
CREATE TYPE public.funcao_viatura AS ENUM ('motorista', 'encarregado', 'patrulheiro', 'apoio');

CREATE TABLE public.pontos_eletronicos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  viatura_id UUID REFERENCES public.viaturas(id),
  funcao funcao_viatura NOT NULL,
  status ponto_status NOT NULL DEFAULT 'ativo',
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fim TIMESTAMP WITH TIME ZONE,
  tempo_total_segundos INTEGER DEFAULT 0,
  pausas JSONB DEFAULT '[]',
  observacao TEXT,
  aprovado_por UUID,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  motivo_recusa TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- CONFIGURAÇÕES DO SITE (FOOTER, LINKS, ETC)
-- =====================================================

-- Já existe a tabela site_settings, vamos usar ela

-- =====================================================
-- ATUALIZAÇÃO DA TABELA PROFILES (ADICIONAR RG)
-- =====================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rg VARCHAR(50);

-- =====================================================
-- ENABLE RLS EM TODAS AS TABELAS
-- =====================================================

ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cargo_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pontos_eletronicos ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNÇÃO PARA VERIFICAR PERMISSÃO
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission_code VARCHAR)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM usuario_cargos uc
    JOIN cargo_permissoes cp ON cp.cargo_id = uc.cargo_id
    JOIN permissoes p ON p.id = cp.permissao_id
    WHERE uc.user_id = _user_id
    AND p.codigo = _permission_code
  )
$$;

-- =====================================================
-- POLÍTICAS RLS
-- =====================================================

-- Cargos - todos podem ver, apenas quem tem permissão pode gerenciar
CREATE POLICY "Todos podem ver cargos" ON public.cargos FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados podem gerenciar cargos" ON public.cargos 
  FOR ALL TO authenticated 
  USING (public.has_permission(auth.uid(), 'gerenciar_cargos'))
  WITH CHECK (public.has_permission(auth.uid(), 'gerenciar_cargos'));

-- Permissões - todos podem ver
CREATE POLICY "Todos podem ver permissões" ON public.permissoes FOR SELECT USING (true);

-- Cargo-Permissões - todos podem ver, apenas quem tem permissão pode gerenciar
CREATE POLICY "Todos podem ver cargo_permissoes" ON public.cargo_permissoes FOR SELECT USING (true);
CREATE POLICY "Gerenciar cargo_permissoes" ON public.cargo_permissoes 
  FOR ALL TO authenticated 
  USING (public.has_permission(auth.uid(), 'gerenciar_cargos'))
  WITH CHECK (public.has_permission(auth.uid(), 'gerenciar_cargos'));

-- Usuário-Cargos - todos podem ver, apenas quem tem permissão pode gerenciar
CREATE POLICY "Todos podem ver usuario_cargos" ON public.usuario_cargos FOR SELECT USING (true);
CREATE POLICY "Gerenciar usuario_cargos" ON public.usuario_cargos 
  FOR ALL TO authenticated 
  USING (public.has_permission(auth.uid(), 'gerenciar_usuarios'))
  WITH CHECK (public.has_permission(auth.uid(), 'gerenciar_usuarios'));

-- Notícias - todos podem ver ativas, apenas quem tem permissão pode gerenciar
CREATE POLICY "Ver notícias ativas" ON public.noticias FOR SELECT USING (ativa = true OR public.has_permission(auth.uid(), 'gerenciar_noticias'));
CREATE POLICY "Gerenciar notícias" ON public.noticias 
  FOR ALL TO authenticated 
  USING (public.has_permission(auth.uid(), 'gerenciar_noticias'))
  WITH CHECK (public.has_permission(auth.uid(), 'gerenciar_noticias'));

-- Pontos Eletrônicos - usuário vê os seus, quem tem permissão vê todos
CREATE POLICY "Ver próprios pontos" ON public.pontos_eletronicos 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid() OR public.has_permission(auth.uid(), 'gerenciar_ponto'));
CREATE POLICY "Criar próprio ponto" ON public.pontos_eletronicos 
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Atualizar próprio ponto" ON public.pontos_eletronicos 
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid() OR public.has_permission(auth.uid(), 'gerenciar_ponto'));
CREATE POLICY "Deletar pontos" ON public.pontos_eletronicos 
  FOR DELETE TO authenticated 
  USING (public.has_permission(auth.uid(), 'gerenciar_ponto'));

-- =====================================================
-- INSERIR PERMISSÕES DO SISTEMA
-- =====================================================

INSERT INTO public.permissoes (codigo, nome, descricao, categoria) VALUES
-- Geral
('acessar_dashboard', 'Acessar Dashboard', 'Permite acessar o painel administrativo', 'Geral'),
-- Sistema
('gerenciar_cargos', 'Gerenciar Cargos', 'Permite criar, editar e excluir cargos', 'Sistema'),
('gerenciar_usuarios', 'Gerenciar Usuários', 'Permite gerenciar usuários do sistema', 'Sistema'),
('configurar_sistema', 'Configurações do Sistema', 'Permite alterar configurações do site', 'Sistema'),
-- Conteúdo
('gerenciar_noticias', 'Gerenciar Notícias', 'Permite criar, editar e excluir notícias', 'Conteúdo'),
('gerenciar_galeria', 'Gerenciar Galeria', 'Permite gerenciar imagens da galeria', 'Conteúdo'),
('gerenciar_regulamentos', 'Gerenciar Regulamentos', 'Permite gerenciar regulamentos', 'Conteúdo'),
-- Hierarquia
('gerenciar_hierarquia', 'Gerenciar Hierarquia', 'Permite gerenciar membros da hierarquia', 'Hierarquia'),
('visualizar_hierarquia', 'Visualizar Hierarquia', 'Permite visualizar a hierarquia', 'Hierarquia'),
-- AITs
('criar_ait', 'Criar AIT', 'Permite criar novos AITs', 'AITs'),
('aprovar_ait', 'Aprovar/Recusar AIT', 'Permite aprovar ou recusar AITs', 'AITs'),
('visualizar_aits', 'Visualizar AITs', 'Permite visualizar todos os AITs', 'AITs'),
('gerar_relatorio_ait', 'Gerar Relatórios AIT', 'Permite gerar relatórios de AITs', 'AITs'),
-- Ponto Eletrônico
('bater_ponto', 'Bater Ponto', 'Permite bater ponto eletrônico', 'Ponto'),
('gerenciar_ponto', 'Gerenciar Ponto', 'Permite aprovar/recusar pontos', 'Ponto'),
('visualizar_pontos', 'Visualizar Pontos', 'Permite visualizar todos os pontos', 'Ponto'),
-- Viaturas
('gerenciar_viaturas', 'Gerenciar Viaturas', 'Permite gerenciar viaturas', 'Viaturas');

-- =====================================================
-- INSERIR CARGOS PADRÃO
-- =====================================================

INSERT INTO public.cargos (nome, descricao, cor, ordem) VALUES
('Membro', 'Membro padrão do sistema', '#6B7280', 100),
('Comandante', 'Comandante com acesso total', '#FFD700', 1);

-- Dar todas as permissões ao cargo Comandante
INSERT INTO public.cargo_permissoes (cargo_id, permissao_id)
SELECT c.id, p.id 
FROM public.cargos c, public.permissoes p
WHERE c.nome = 'Comandante';

-- Dar permissões básicas ao cargo Membro
INSERT INTO public.cargo_permissoes (cargo_id, permissao_id)
SELECT c.id, p.id 
FROM public.cargos c, public.permissoes p
WHERE c.nome = 'Membro' 
AND p.codigo IN ('visualizar_hierarquia', 'criar_ait', 'bater_ponto');

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_cargos_updated_at BEFORE UPDATE ON public.cargos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_noticias_updated_at BEFORE UPDATE ON public.noticias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pontos_updated_at BEFORE UPDATE ON public.pontos_eletronicos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();