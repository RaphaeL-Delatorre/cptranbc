import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Regulamento {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  documento_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useRegulamentos = () => {
  return useQuery({
    queryKey: ["regulamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regulamentos")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as Regulamento[];
    },
  });
};

export const useCreateRegulamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { titulo: string; descricao?: string; categoria?: string; documento_url?: string; display_order?: number }) => {
      const { data: result, error } = await supabase
        .from("regulamentos")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulamentos"] });
    },
  });
};

export const useUpdateRegulamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; titulo?: string; descricao?: string; categoria?: string; documento_url?: string; display_order?: number }) => {
      const { data: result, error } = await supabase
        .from("regulamentos")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulamentos"] });
    },
  });
};

export const useDeleteRegulamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("regulamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regulamentos"] });
    },
  });
};
