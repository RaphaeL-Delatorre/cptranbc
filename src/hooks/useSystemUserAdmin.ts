import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SYSTEM_USERS_QUERY_KEY } from "@/hooks/useSystem";

export const useCreateSystemUser = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      nome: string;
      rg: string;
      password: string;
      email: string;
      cargoId: string | null;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("manage-users", {
        body: {
          action: "create",
          email: payload.email,
          password: payload.password,
          nome: payload.nome,
          rg: payload.rg,
          cargoId: payload.cargoId,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      return response.data.user;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SYSTEM_USERS_QUERY_KEY });
    },
  });
};

export const useDeleteSystemUser = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("manage-users", {
        body: { action: "delete", userId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SYSTEM_USERS_QUERY_KEY });
    },
  });
};

export const useUpdateSystemUserPassword = () => {
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("manage-users", {
        body: { action: "updatePassword", userId, newPassword },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);
      return response.data;
    },
  });
};
