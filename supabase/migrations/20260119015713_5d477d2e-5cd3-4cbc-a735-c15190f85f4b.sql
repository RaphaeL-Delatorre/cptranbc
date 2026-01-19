-- 1) Ensure profiles has unique RG (numeric string) and email unique
create unique index if not exists profiles_rg_unique on public.profiles (rg) where rg is not null;
create unique index if not exists profiles_email_unique on public.profiles (lower(email));

-- 2) Update handle_new_user trigger function to also persist RG from user metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, nome, email, rg)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.email),
    new.email,
    nullif(new.raw_user_meta_data ->> 'rg', '')
  );
  return new;
end;
$$;

-- 3) Allow management of "permissoes" by users who can manage cargos (or admins)
alter table public.permissoes enable row level security;

do $$
begin
  -- INSERT
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='permissoes' and policyname='Gerenciar permissões'
  ) then
    create policy "Gerenciar permissões"
    on public.permissoes
    for all
    using (has_permission(auth.uid(), 'gerenciar_cargos'::character varying) or has_role(auth.uid(), 'admin'::app_role))
    with check (has_permission(auth.uid(), 'gerenciar_cargos'::character varying) or has_role(auth.uid(), 'admin'::app_role));
  end if;
end $$;

-- 4) Seed baseline permissions (idempotent)
insert into public.permissoes (codigo, nome, categoria, descricao)
select * from (
  values
    ('acessar_dashboard', 'Acessar Dashboard', 'Geral', 'Permite acessar o painel administrativo'),
    ('gerenciar_usuarios', 'Gerenciar Usuários', 'Sistema', 'Criar/editar/excluir usuários e alterar senha/RG'),
    ('gerenciar_cargos', 'Gerenciar Cargos', 'Sistema', 'Criar/editar/excluir cargos e atribuir permissões'),
    ('gerenciar_ponto', 'Gerenciar Ponto Eletrônico', 'Setores', 'Aprovar/reprovar e excluir pontos'),
    ('gerenciar_noticias', 'Gerenciar Notícias', 'Conteúdo', 'Criar/editar/excluir notícias'),
    ('gerenciar_hierarquia', 'Gerenciar Hierarquia', 'Hierarquia', 'Criar/editar/excluir membros'),
    ('gerenciar_regulamentos', 'Gerenciar Regulamentos', 'Conteúdo', 'Criar/editar/excluir regulamentos'),
    ('gerenciar_galeria', 'Gerenciar Galeria', 'Conteúdo', 'Upload e remoção de imagens da galeria'),
    ('gerenciar_aits', 'Gerenciar AITs', 'Setores', 'Aprovar/reprovar e excluir AITs'),
    ('configurar_site', 'Configurar Site', 'Sistema', 'Alterar configurações do site')
) as v(codigo, nome, categoria, descricao)
where not exists (
  select 1 from public.permissoes p where p.codigo = v.codigo
);

-- 5) Create OWNER cargo (idempotent)
insert into public.cargos (nome, descricao, cor, ordem)
select 'Owner', 'Dono do sistema (todas as permissões)', '#FFD700', 0
where not exists (select 1 from public.cargos where nome = 'Owner');

-- 6) Assign all permissions to Owner cargo (idempotent)
insert into public.cargo_permissoes (cargo_id, permissao_id)
select c.id, p.id
from public.cargos c
cross join public.permissoes p
where c.nome = 'Owner'
  and not exists (
    select 1 from public.cargo_permissoes cp
    where cp.cargo_id = c.id and cp.permissao_id = p.id
  );

-- 7) Attach Owner cargo to adm2@gmail.com (idempotent)
insert into public.usuario_cargos (user_id, cargo_id)
select pr.user_id, c.id
from public.profiles pr
join public.cargos c on c.nome = 'Owner'
where lower(pr.email) = lower('adm2@gmail.com')
  and not exists (
    select 1 from public.usuario_cargos uc
    where uc.user_id = pr.user_id and uc.cargo_id = c.id
  );
