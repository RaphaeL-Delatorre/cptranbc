-- Tighten overly permissive RLS policies flagged by linter

-- hierarquia: restrict write operations to users with proper permission
alter table public.hierarquia enable row level security;

drop policy if exists "Authenticated users can insert hierarquia" on public.hierarquia;
drop policy if exists "Authenticated users can update hierarquia" on public.hierarquia;
drop policy if exists "Authenticated users can delete hierarquia" on public.hierarquia;

create policy "Gerenciar hierarquia"
on public.hierarquia
for insert
with check (
  has_permission(auth.uid(), 'gerenciar_hierarquia'::character varying)
  or has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'moderador'::app_role)
);

create policy "Atualizar hierarquia"
on public.hierarquia
for update
using (
  has_permission(auth.uid(), 'gerenciar_hierarquia'::character varying)
  or has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'moderador'::app_role)
)
with check (
  has_permission(auth.uid(), 'gerenciar_hierarquia'::character varying)
  or has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'moderador'::app_role)
);

create policy "Deletar hierarquia"
on public.hierarquia
for delete
using (
  has_permission(auth.uid(), 'gerenciar_hierarquia'::character varying)
  or has_role(auth.uid(), 'admin'::app_role)
  or has_role(auth.uid(), 'moderador'::app_role)
);

-- aits: restrict creation to authenticated users creating their own AIT
alter table public.aits enable row level security;

drop policy if exists "Anyone can create AITs" on public.aits;

create policy "Authenticated can create AITs"
on public.aits
for insert
with check (
  auth.uid() is not null
  and (agente_id is null or agente_id = auth.uid())
);
