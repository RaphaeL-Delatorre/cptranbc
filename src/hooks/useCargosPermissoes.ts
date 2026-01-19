import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserCargo = {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string | null;
  ordem: number | null;
};

export type UserPermissao = {
  id: string;
  codigo: string;
  nome: string;
  categoria: string;
  descricao: string | null;
};

export const useUserCargosPermissoes = (userId?: string) => {
  return useQuery({
    queryKey: ["user-cargos-permissoes", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return { cargos: [] as UserCargo[], permissoes: [] as UserPermissao[] };

      const { data: userCargos, error: userCargosError } = await supabase
        .from("usuario_cargos")
        .select("cargo_id")
        .eq("user_id", userId);

      if (userCargosError) throw userCargosError;

      const cargoIds = Array.from(new Set((userCargos ?? []).map((r) => r.cargo_id)));
      if (cargoIds.length === 0) {
        return { cargos: [] as UserCargo[], permissoes: [] as UserPermissao[] };
      }

      const [{ data: cargos, error: cargosError }, { data: cps, error: cpsError }] = await Promise.all([
        supabase
          .from("cargos")
          .select("id,nome,descricao,cor,ordem")
          .in("id", cargoIds)
          .order("ordem", { ascending: true }),
        supabase
          .from("cargo_permissoes")
          .select("cargo_id, permissoes:permissao_id (id,codigo,nome,categoria,descricao)")
          .in("cargo_id", cargoIds),
      ]);

      if (cargosError) throw cargosError;
      if (cpsError) throw cpsError;

      const permissoes = (cps ?? [])
        .map((row: any) => row.permissoes)
        .filter(Boolean) as UserPermissao[];

      const uniquePerms = Array.from(new Map(permissoes.map((p) => [p.id, p])).values()).sort((a, b) => {
        const cat = a.categoria.localeCompare(b.categoria);
        if (cat !== 0) return cat;
        return a.nome.localeCompare(b.nome);
      });

      return {
        cargos: ((cargos ?? []) as UserCargo[]).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
        permissoes: uniquePerms,
      };
    },
  });
};
