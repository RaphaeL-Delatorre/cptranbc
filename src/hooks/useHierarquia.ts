import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type HierarquiaRow = Database["public"]["Tables"]["hierarquia"]["Row"];
type HierarquiaInsert = Database["public"]["Tables"]["hierarquia"]["Insert"];

export interface HierarquiaMembro extends HierarquiaRow {}

export interface CreateHierarquiaData {
  nome: string;
  rg: string;
  patente: string;
  funcao: string;
  observacao?: string;
  data_entrada: string;
}

export const useHierarquia = () => {
  return useQuery({
    queryKey: ["hierarquia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hierarquia")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as HierarquiaMembro[];
    },
  });
};

export const useCreateHierarquia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateHierarquiaData) => {
      const insertData: HierarquiaInsert = {
        nome: data.nome,
        rg: data.rg,
        patente: data.patente as HierarquiaInsert["patente"],
        funcao: data.funcao,
        observacao: data.observacao,
        data_entrada: data.data_entrada,
      };

      const { data: result, error } = await supabase
        .from("hierarquia")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarquia"] });
    },
  });
};

export const useUpdateHierarquia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Partial<CreateHierarquiaData> & { id: string }) => {
      const updateData: Partial<HierarquiaInsert> = {};
      
      if (data.nome) updateData.nome = data.nome;
      if (data.rg) updateData.rg = data.rg;
      if (data.patente) updateData.patente = data.patente as HierarquiaInsert["patente"];
      if (data.funcao) updateData.funcao = data.funcao;
      if (data.observacao !== undefined) updateData.observacao = data.observacao;
      if (data.data_entrada) updateData.data_entrada = data.data_entrada;

      const { data: result, error } = await supabase
        .from("hierarquia")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarquia"] });
    },
  });
};

export const useDeleteHierarquia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hierarquia").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hierarquia"] });
    },
  });
};
