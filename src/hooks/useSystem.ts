import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Cargo = Database["public"]["Tables"]["cargos"]["Row"];
export type Permissao = Database["public"]["Tables"]["permissoes"]["Row"];

export type SystemUser = {
  user_id: string;
  nome: string;
  email: string;
  rg: string | null;
  created_at: string;
  cargo?: { id: string; nome: string; cor: string | null };
};

export const SYSTEM_USERS_QUERY_KEY = ["system-users"] as const;
export const CARGOS_QUERY_KEY = ["cargos"] as const;
export const PERMISSOES_QUERY_KEY = ["permissoes"] as const;
export const CARGO_PERMISSOES_QUERY_KEY = (cargoId?: string) => ["cargo-permissoes", cargoId] as const;

export const useSystemUsers = () => {
  return useQuery({
    queryKey: SYSTEM_USERS_QUERY_KEY,
    queryFn: async (): Promise<SystemUser[]> => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id,nome,email,rg,created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: userCargos, error: userCargosError } = await supabase
        .from("usuario_cargos")
        .select("user_id,cargo_id,cargos(id,nome,cor)");

      if (userCargosError) throw userCargosError;

      const cargoByUserId = new Map<string, { id: string; nome: string; cor: string | null }>();
      (userCargos || []).forEach((uc: any) => {
        if (uc?.user_id && uc?.cargos) {
          cargoByUserId.set(uc.user_id, {
            id: uc.cargos.id,
            nome: uc.cargos.nome,
            cor: uc.cargos.cor ?? null,
          });
        }
      });

      return (profiles || []).map((p) => ({
        user_id: p.user_id,
        nome: p.nome,
        email: p.email,
        rg: p.rg,
        created_at: p.created_at,
        cargo: cargoByUserId.get(p.user_id),
      }));
    },
  });
};

export const useCargos = () => {
  return useQuery({
    queryKey: CARGOS_QUERY_KEY,
    queryFn: async (): Promise<Cargo[]> => {
      const { data, error } = await supabase
        .from("cargos")
        .select("*")
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Cargo[];
    },
  });
};

export const usePermissoes = () => {
  return useQuery({
    queryKey: PERMISSOES_QUERY_KEY,
    queryFn: async (): Promise<Permissao[]> => {
      const { data, error } = await supabase
        .from("permissoes")
        .select("*")
        .order("categoria", { ascending: true })
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as Permissao[];
    },
  });
};

export const useCargoPermissoes = (cargoId?: string) => {
  return useQuery({
    queryKey: CARGO_PERMISSOES_QUERY_KEY(cargoId),
    enabled: !!cargoId,
    queryFn: async (): Promise<string[]> => {
      if (!cargoId) return [];
      const { data, error } = await supabase
        .from("cargo_permissoes")
        .select("permissao_id")
        .eq("cargo_id", cargoId);
      if (error) throw error;
      return (data || []).map((r) => r.permissao_id);
    },
  });
};

export const useCreateCargo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { nome: string; descricao?: string; cor?: string; ordem?: number }) => {
      const { data, error } = await supabase
        .from("cargos")
        .insert({
          nome: payload.nome,
          descricao: payload.descricao ?? null,
          cor: payload.cor ?? null,
          ordem: payload.ordem ?? 0,
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as Cargo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CARGOS_QUERY_KEY });
    },
  });
};

export const useDeleteCargo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cargoId: string) => {
      // remove mappings first
      await supabase.from("cargo_permissoes").delete().eq("cargo_id", cargoId);
      await supabase.from("usuario_cargos").delete().eq("cargo_id", cargoId);
      const { error } = await supabase.from("cargos").delete().eq("id", cargoId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CARGOS_QUERY_KEY });
      qc.invalidateQueries({ queryKey: SYSTEM_USERS_QUERY_KEY });
    },
  });
};

export const useSetCargoPermissoes = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cargoId, permissaoIds }: { cargoId: string; permissaoIds: string[] }) => {
      await supabase.from("cargo_permissoes").delete().eq("cargo_id", cargoId);
      if (permissaoIds.length > 0) {
        const { error } = await supabase
          .from("cargo_permissoes")
          .insert(permissaoIds.map((permissao_id) => ({ cargo_id: cargoId, permissao_id })));
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: CARGO_PERMISSOES_QUERY_KEY(vars.cargoId) });
    },
  });
};

export const useSetUserCargo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, cargoId }: { userId: string; cargoId: string | null }) => {
      await supabase.from("usuario_cargos").delete().eq("user_id", userId);
      if (cargoId) {
        const { error } = await supabase.from("usuario_cargos").insert({ user_id: userId, cargo_id: cargoId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SYSTEM_USERS_QUERY_KEY });
    },
  });
};

export const useUpdateUserRg = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, rg }: { userId: string; rg: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ rg })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SYSTEM_USERS_QUERY_KEY });
    },
  });
};
