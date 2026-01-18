import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PontoEletronico {
  id: string;
  user_id: string;
  viatura_id: string | null;
  viatura: string | null;
  ponto_discord: string | null;
  funcao: "motorista" | "encarregado" | "patrulheiro" | "apoio";
  patente: string | null;
  nome_policial: string | null;
  status: "ativo" | "pausado" | "finalizado" | "pendente" | "aprovado" | "recusado";
  data_inicio: string;
  data_fim: string | null;
  tempo_total_segundos: number | null;
  pausas: { inicio: string; fim?: string }[] | null;
  observacao: string | null;
  aprovado_por: string | null;
  aprovador_nome: string | null;
  data_aprovacao: string | null;
  motivo_recusa: string | null;
  created_at: string;
  updated_at: string;
}

export const usePontosEletronicos = () => {
  return useQuery({
    queryKey: ["pontos-eletronicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pontos_eletronicos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PontoEletronico[];
    },
  });
};

export const useMeusPontos = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["meus-pontos", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("pontos_eletronicos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PontoEletronico[];
    },
    enabled: !!user?.id,
  });
};

export const usePontoPendente = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["ponto-pendente", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("pontos_eletronicos")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["ativo", "pausado"])
        .maybeSingle();

      if (error) throw error;
      return data as PontoEletronico | null;
    },
    enabled: !!user?.id,
  });
};

export const useCreatePonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      funcao: string;
      patente: string;
      nome_policial: string;
      viatura?: string;
      viatura_id?: string;
      ponto_discord?: string;
      observacao?: string;
    }) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user) throw new Error("Usuário não autenticado");

      const { data: result, error } = await supabase
        .from("pontos_eletronicos")
        .insert({
          user_id: session.session.user.id,
          funcao: data.funcao as "motorista" | "encarregado" | "patrulheiro" | "apoio",
          patente: data.patente,
          nome_policial: data.nome_policial,
          viatura: data.viatura || null,
          viatura_id: data.viatura_id || null,
          ponto_discord: data.ponto_discord || null,
          observacao: data.observacao || null,
          status: "ativo",
          data_inicio: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
      queryClient.invalidateQueries({ queryKey: ["ponto-pendente"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos"] });
    },
  });
};

export const usePausePonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pontoId: string) => {
      const { data: ponto, error: fetchError } = await supabase
        .from("pontos_eletronicos")
        .select("pausas")
        .eq("id", pontoId)
        .single();

      if (fetchError) throw fetchError;

      const pausas = (ponto?.pausas as { inicio: string; fim?: string }[] | null) || [];
      pausas.push({ inicio: new Date().toISOString() });

      const { error } = await supabase
        .from("pontos_eletronicos")
        .update({ 
          status: "pausado",
          pausas 
        })
        .eq("id", pontoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
      queryClient.invalidateQueries({ queryKey: ["ponto-pendente"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos"] });
    },
  });
};

export const useResumePonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pontoId: string) => {
      const { data: ponto, error: fetchError } = await supabase
        .from("pontos_eletronicos")
        .select("pausas")
        .eq("id", pontoId)
        .single();

      if (fetchError) throw fetchError;

      const pausas = (ponto?.pausas as { inicio: string; fim?: string }[] | null) || [];
      if (pausas.length > 0 && !pausas[pausas.length - 1].fim) {
        pausas[pausas.length - 1].fim = new Date().toISOString();
      }

      const { error } = await supabase
        .from("pontos_eletronicos")
        .update({ 
          status: "ativo",
          pausas 
        })
        .eq("id", pontoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
      queryClient.invalidateQueries({ queryKey: ["ponto-pendente"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos"] });
    },
  });
};

export const useFinalizePonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pontoId: string) => {
      const { data: ponto, error: fetchError } = await supabase
        .from("pontos_eletronicos")
        .select("*")
        .eq("id", pontoId)
        .single();

      if (fetchError) throw fetchError;

      // Calculate total time
      const dataInicio = new Date(ponto.data_inicio);
      const dataFim = new Date();
      let tempoTotal = Math.floor((dataFim.getTime() - dataInicio.getTime()) / 1000);

      // Subtract pause times
      const pausas = (ponto.pausas as { inicio: string; fim?: string }[] | null) || [];
      for (const pausa of pausas) {
        if (pausa.fim) {
          const pausaInicio = new Date(pausa.inicio);
          const pausaFim = new Date(pausa.fim);
          tempoTotal -= Math.floor((pausaFim.getTime() - pausaInicio.getTime()) / 1000);
        }
      }

      // Close any open pause
      if (pausas.length > 0 && !pausas[pausas.length - 1].fim) {
        pausas[pausas.length - 1].fim = dataFim.toISOString();
      }

      const { error } = await supabase
        .from("pontos_eletronicos")
        .update({ 
          status: "pendente",
          data_fim: dataFim.toISOString(),
          tempo_total_segundos: tempoTotal,
          pausas
        })
        .eq("id", pontoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
      queryClient.invalidateQueries({ queryKey: ["ponto-pendente"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos"] });
    },
  });
};

export const useApprovePonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pontoId: string) => {
      const { data: session } = await supabase.auth.getSession();
      
      // Get approver name
      let aprovadorNome = null;
      if (session.session?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome")
          .eq("user_id", session.session.user.id)
          .single();
        aprovadorNome = profile?.nome || session.session.user.email;
      }
      
      const { error } = await supabase
        .from("pontos_eletronicos")
        .update({ 
          status: "aprovado",
          aprovado_por: session.session?.user?.id,
          aprovador_nome: aprovadorNome,
          data_aprovacao: new Date().toISOString()
        })
        .eq("id", pontoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos"] });
    },
  });
};

export const useRejectPonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pontoId, motivo }: { pontoId: string; motivo?: string }) => {
      const { data: session } = await supabase.auth.getSession();
      
      // Get rejector name
      let aprovadorNome = null;
      if (session.session?.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("nome")
          .eq("user_id", session.session.user.id)
          .single();
        aprovadorNome = profile?.nome || session.session.user.email;
      }
      
      const { error } = await supabase
        .from("pontos_eletronicos")
        .update({ 
          status: "recusado",
          aprovado_por: session.session?.user?.id,
          aprovador_nome: aprovadorNome,
          data_aprovacao: new Date().toISOString(),
          motivo_recusa: motivo || null
        })
        .eq("id", pontoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos"] });
    },
  });
};

export const useDeletePonto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pontoId: string) => {
      const { error } = await supabase
        .from("pontos_eletronicos")
        .delete()
        .eq("id", pontoId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos"] });
    },
  });
};

export const useDeleteAllPontos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("pontos_eletronicos")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pontos-eletronicos"] });
      queryClient.invalidateQueries({ queryKey: ["meus-pontos"] });
    },
  });
};

// Helper function to format seconds to HH:MM:SS
export const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};