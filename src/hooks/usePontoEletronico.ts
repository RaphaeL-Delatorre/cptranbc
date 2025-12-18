import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PontoStatus = "ativo" | "pausado" | "finalizado" | "pendente" | "aprovado" | "recusado";
export type FuncaoViatura = "motorista" | "encarregado" | "patrulheiro" | "apoio";

export interface PontoEletronico {
  id: string;
  user_id: string;
  viatura_id: string | null;
  funcao: FuncaoViatura;
  status: PontoStatus;
  data_inicio: string;
  data_fim: string | null;
  tempo_total_segundos: number;
  pausas: Array<{ inicio: string; fim?: string }>;
  observacao: string | null;
  aprovado_por: string | null;
  data_aprovacao: string | null;
  motivo_recusa: string | null;
  created_at: string;
  updated_at: string;
}

export const usePontosEletronicos = (status?: PontoStatus) => {
  return useQuery({
    queryKey: ["pontos-eletronicos", status],
    queryFn: async () => {
      let query = supabase
        .from("pontos_eletronicos")
        .select(`
          *,
          viatura:viaturas(*),
          usuario:profiles!pontos_eletronicos_user_id_fkey(*)
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

export const useMeusPontos = (userId?: string) => {
  return useQuery({
    queryKey: ["meus-pontos", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("pontos_eletronicos")
        .select(`
          *,
          viatura:viaturas(*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

export const usePontoAtivo = (userId?: string) => {
  return useQuery({
    queryKey: ["ponto-ativo", userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from("pontos_eletronicos")
        .select(`
          *,
          viatura:viaturas(*)
        `)
        .eq("user_id", userId)
        .in("status", ["ativo", "pausado"])
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
    enabled: !!userId,
  });
};

export const useIniciarPonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      viatura_id: string;
      funcao: FuncaoViatura;
    }) => {
      const { data: result, error } = await supabase
        .from("pontos_eletronicos")
        .insert({
          ...data,
          status: "ativo",
          data_inicio: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos", variables.user_id] });
      queryClient.invalidateQueries({ queryKey: ["ponto-ativo", variables.user_id] });
    },
  });
};

export const usePausarPonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pausas }: { id: string; pausas: Array<{ inicio: string; fim?: string }> }) => {
      const novaPausa = { inicio: new Date().toISOString() };
      const novasPausas = [...pausas, novaPausa];

      const { data, error } = await supabase
        .from("pontos_eletronicos")
        .update({
          status: "pausado",
          pausas: novasPausas,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos"] });
      queryClient.invalidateQueries({ queryKey: ["ponto-ativo"] });
    },
  });
};

export const useRetomarPonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pausas }: { id: string; pausas: Array<{ inicio: string; fim?: string }> }) => {
      // Update the last pause with end time
      const novasPausas = pausas.map((p, i) => {
        if (i === pausas.length - 1 && !p.fim) {
          return { ...p, fim: new Date().toISOString() };
        }
        return p;
      });

      const { data, error } = await supabase
        .from("pontos_eletronicos")
        .update({
          status: "ativo",
          pausas: novasPausas,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos"] });
      queryClient.invalidateQueries({ queryKey: ["ponto-ativo"] });
    },
  });
};

export const useFinalizarPonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pausas, dataInicio }: { id: string; pausas: Array<{ inicio: string; fim?: string }>; dataInicio: string }) => {
      const dataFim = new Date();
      
      // Calculate total pause time
      let tempoTotalPausas = 0;
      pausas.forEach((p) => {
        const inicio = new Date(p.inicio);
        const fim = p.fim ? new Date(p.fim) : dataFim;
        tempoTotalPausas += (fim.getTime() - inicio.getTime()) / 1000;
      });

      // Calculate total time worked
      const tempoTotal = Math.floor((dataFim.getTime() - new Date(dataInicio).getTime()) / 1000 - tempoTotalPausas);

      // Close any open pause
      const pausasFinais = pausas.map((p) => {
        if (!p.fim) {
          return { ...p, fim: dataFim.toISOString() };
        }
        return p;
      });

      const { data, error } = await supabase
        .from("pontos_eletronicos")
        .update({
          status: "pendente",
          data_fim: dataFim.toISOString(),
          tempo_total_segundos: tempoTotal,
          pausas: pausasFinais,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos"] });
      queryClient.invalidateQueries({ queryKey: ["ponto-ativo"] });
    },
  });
};

export const useAprovarPonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, aprovadoPor }: { id: string; aprovadoPor: string }) => {
      const { data, error } = await supabase
        .from("pontos_eletronicos")
        .update({
          status: "aprovado",
          aprovado_por: aprovadoPor,
          data_aprovacao: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
    },
  });
};

export const useRecusarPonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from("pontos_eletronicos")
        .update({
          status: "recusado",
          motivo_recusa: motivo,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
    },
  });
};

export const useDeletePonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pontos_eletronicos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
    },
  });
};

export const useDeleteAllPontos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (status?: PontoStatus) => {
      let query = supabase.from("pontos_eletronicos").delete();
      
      if (status) {
        query = query.eq("status", status);
      }

      const { error } = await query.neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
    },
  });
};
