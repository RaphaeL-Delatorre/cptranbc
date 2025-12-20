import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Cargo {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface Permissao {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  categoria: string;
  created_at: string;
}

export interface CargoPermissao {
  id: string;
  cargo_id: string;
  permissao_id: string;
  created_at: string;
}

export interface UsuarioCargo {
  id: string;
  user_id: string;
  cargo_id: string;
  created_at: string;
}

// Fetch all cargos
export const useCargos = () => {
  return useQuery({
    queryKey: ["cargos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as Cargo[];
    },
  });
};

// Fetch all permissions
export const usePermissoes = () => {
  return useQuery({
    queryKey: ["permissoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissoes")
        .select("*")
        .order("categoria", { ascending: true });

      if (error) throw error;
      return data as Permissao[];
    },
  });
};

// Fetch cargo permissions
export const useCargoPermissoes = (cargoId?: string) => {
  return useQuery({
    queryKey: ["cargo-permissoes", cargoId],
    queryFn: async () => {
      let query = supabase.from("cargo_permissoes").select("*");
      
      if (cargoId) {
        query = query.eq("cargo_id", cargoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CargoPermissao[];
    },
  });
};

// Fetch user's cargos
export const useUsuarioCargos = (userId?: string) => {
  return useQuery({
    queryKey: ["usuario-cargos", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("usuario_cargos")
        .select(`
          *,
          cargo:cargos(*)
        `)
        .eq("user_id", userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Check if user has a specific permission
export const useHasPermission = (userId?: string, permissionCode?: string) => {
  return useQuery({
    queryKey: ["has-permission", userId, permissionCode],
    queryFn: async () => {
      if (!userId || !permissionCode) return false;

      const { data, error } = await supabase.rpc("has_permission", {
        _user_id: userId,
        _permission_code: permissionCode,
      });

      if (error) {
        console.error("Error checking permission:", error);
        return false;
      }
      return data as boolean;
    },
    enabled: !!userId && !!permissionCode,
  });
};

// Fetch all permissions for a user
export const useUserPermissions = (userId?: string) => {
  return useQuery({
    queryKey: ["user-permissions", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get user's cargos
      const { data: userCargos, error: cargosError } = await supabase
        .from("usuario_cargos")
        .select("cargo_id")
        .eq("user_id", userId);

      if (cargosError) throw cargosError;
      if (!userCargos || userCargos.length === 0) return [];

      const cargoIds = userCargos.map((uc) => uc.cargo_id);

      // Get permissions for those cargos
      const { data: cargoPermissoes, error: permError } = await supabase
        .from("cargo_permissoes")
        .select(`
          permissao:permissoes(*)
        `)
        .in("cargo_id", cargoIds);

      if (permError) throw permError;

      // Extract unique permissions
      const permissionsMap = new Map<string, Permissao>();
      cargoPermissoes?.forEach((cp: any) => {
        if (cp.permissao) {
          permissionsMap.set(cp.permissao.codigo, cp.permissao);
        }
      });

      return Array.from(permissionsMap.values());
    },
    enabled: !!userId,
  });
};

// Hook to check multiple permissions at once
export const useCheckPermissions = (userId?: string) => {
  const { data: permissions = [], isLoading } = useUserPermissions(userId);

  const hasPermission = (code: string) => {
    return permissions.some((p) => p.codigo === code);
  };

  const hasAnyPermission = (codes: string[]) => {
    return codes.some((code) => hasPermission(code));
  };

  const hasAllPermissions = (codes: string[]) => {
    return codes.every((code) => hasPermission(code));
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
};
// ===== Mutations adicionadas para corrigir erro de build =====
export async function createCargo(data: any) {
  const res = await fetch("/api/cargos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateCargo(id: string, data: any) {
  const res = await fetch(`/api/cargos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteCargo(id: string) {
  const res = await fetch(`/api/cargos/${id}`, {
    method: "DELETE",
  });
  return res.json();
}

export async function addCargoPermissao(cargoId: string, permissaoId: string) {
  const res = await fetch(`/api/cargos/${cargoId}/permissoes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissaoId }),
  });
  return res.json();
}

export async function removeCargoPermissao(cargoId: string, permissaoId: string) {
  const res = await fetch(
    `/api/cargos/${cargoId}/permissoes/${permissaoId}`,
    { method: "DELETE" }
  );
  return res.json();
}
