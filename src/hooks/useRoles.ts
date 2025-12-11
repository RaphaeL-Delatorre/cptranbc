import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export const useUserRoles = (userId?: string) => {
  return useQuery({
    queryKey: ["user-roles", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return data as UserRole[];
    },
    enabled: !!userId,
  });
};

export const useHasRole = (userId?: string, role?: AppRole) => {
  const { data: roles, isLoading } = useUserRoles(userId);
  
  const hasRole = roles?.some((r) => r.role === role) ?? false;
  
  return { hasRole, isLoading };
};

export const useIsAdmin = (userId?: string) => {
  return useHasRole(userId, "admin");
};

export const useIsModerador = (userId?: string) => {
  return useHasRole(userId, "moderador");
};

export const useIsAdminOrModerador = (userId?: string) => {
  const { data: roles, isLoading } = useUserRoles(userId);
  
  const hasRole = roles?.some((r) => r.role === "admin" || r.role === "moderador") ?? false;
  
  return { hasRole, isLoading };
};
