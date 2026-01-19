-- Allow users with gerenciar_usuarios (or admin) to update any profile (e.g., change RG)
alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Gerenciar perfis (admin)'
  ) then
    create policy "Gerenciar perfis (admin)"
    on public.profiles
    for update
    using (
      has_permission(auth.uid(), 'gerenciar_usuarios'::character varying)
      or has_role(auth.uid(), 'admin'::app_role)
    )
    with check (
      has_permission(auth.uid(), 'gerenciar_usuarios'::character varying)
      or has_role(auth.uid(), 'admin'::app_role)
    );
  end if;
end $$;
