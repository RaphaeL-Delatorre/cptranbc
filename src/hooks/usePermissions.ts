import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useHasPermission = (permissionCode: string, userId?: string) => {
  return useQuery({
    queryKey: ["has-permission", permissionCode, userId],
    queryFn: async () => {
      if (!userId) return false;

      const { data, error } = await supabase.rpc("has_permission", {
        _permission_code: permissionCode,
        _user_id: userId,
      });

      if (error) throw error;
      return Boolean(data);
    },
    enabled: Boolean(permissionCode && userId),
  });
};
