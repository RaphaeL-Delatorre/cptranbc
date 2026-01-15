import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AITRow = Database["public"]["Tables"]["aits"]["Row"];
type AITInsert = Database["public"]["Tables"]["aits"]["Insert"];

export interface AIT extends AITRow {}

export interface CreateAITData {
  graduacao: string;
  nome_agente: string;
  primeiro_homem: string;
  primeiro_homem_patente?: string;
  segundo_homem?: string;
  segundo_homem_patente?: string;
  terceiro_homem?: string;
  terceiro_homem_patente?: string;
  quarto_homem?: string;
  quarto_homem_patente?: string;
  viatura: string;
  relatorio: string;
  nome_condutor: string;
  passaporte_condutor: string;
  nome_proprietario?: string;
  passaporte_proprietario?: string;
  emplacamento: string;
  marca_modelo: string;
  artigos_infringidos: string[];
  providencias_tomadas: string[];
  data_inicio?: string;
  data_termino?: string;
  imagens?: string[];
}

export const useAITs = () => {
  return useQuery({
    queryKey: ["aits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("aits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AIT[];
    },
  });
};

export const useAITStats = () => {
  return useQuery({
    queryKey: ["ait-stats"],
    queryFn: async () => {
      const { data: aits, error } = await supabase.from("aits").select("*");

      if (error) throw error;

      const aprovados = aits?.filter((a) => a.status === "aprovado") || [];
      const pendentes = aits?.filter((a) => a.status === "pendente") || [];
      const recusados = aits?.filter((a) => a.status === "recusado") || [];

      // Count providencias
      const allProvidencias = aprovados.flatMap((a) => a.providencias_tomadas || []);
      const multas = allProvidencias.filter((p) => p === "Lavragem de Multa").length;
      const apreensoes = allProvidencias.filter((p) => p === "Apreensão do Veículo").length;
      const revogacoes = allProvidencias.filter((p) => p === "Revogação da CNH").length;
      const prisoes = allProvidencias.filter((p) => p === "Prisão do Condutor").length;

      // Count most common article
      const artigosCount: Record<string, number> = {};
      aprovados.forEach((a) => {
        (a.artigos_infringidos || []).forEach((art: string) => {
          const match = art.match(/Art\. (\d+)/);
          if (match) {
            artigosCount[match[1]] = (artigosCount[match[1]] || 0) + 1;
          }
        });
      });

      const mostCommonArticle = Object.entries(artigosCount).sort(
        (a, b) => b[1] - a[1]
      )[0];

      return {
        totalAITs: aprovados.length,
        pendentes: pendentes.length,
        recusados: recusados.length,
        multas,
        apreensoes,
        revogacoes,
        prisoes,
        artigoMaisInfringido: mostCommonArticle ? parseInt(mostCommonArticle[0]) : 0,
      };
    },
  });
};

export const useCreateAIT = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAITData) => {
      const { data: user } = await supabase.auth.getUser();

      const insertData: Record<string, unknown> = {
        graduacao: data.graduacao,
        nome_agente: data.nome_agente,
        primeiro_homem: data.primeiro_homem,
        primeiro_homem_patente: data.primeiro_homem_patente || null,
        segundo_homem: data.segundo_homem || null,
        segundo_homem_patente: data.segundo_homem_patente || null,
        terceiro_homem: data.terceiro_homem || null,
        terceiro_homem_patente: data.terceiro_homem_patente || null,
        quarto_homem: data.quarto_homem || null,
        quarto_homem_patente: data.quarto_homem_patente || null,
        viatura: data.viatura,
        relatorio: data.relatorio,
        nome_condutor: data.nome_condutor,
        passaporte_condutor: data.passaporte_condutor,
        nome_proprietario: data.nome_proprietario || null,
        passaporte_proprietario: data.passaporte_proprietario || null,
        emplacamento: data.emplacamento,
        marca_modelo: data.marca_modelo,
        artigos_infringidos: data.artigos_infringidos,
        providencias_tomadas: data.providencias_tomadas,
        agente_id: user?.user?.id || null,
        data_inicio: data.data_inicio || null,
        data_termino: data.data_termino || null,
        imagens: data.imagens || [],
      };

      const { data: result, error } = await supabase
        .from("aits")
        .insert(insertData as AITInsert)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aits"] });
      queryClient.invalidateQueries({ queryKey: ["ait-stats"] });
    },
  });
};

export const useUpdateAITStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      motivo_recusa,
    }: {
      id: string;
      status: "aprovado" | "recusado";
      motivo_recusa?: string;
    }) => {
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

      const { data, error } = await supabase
        .from("aits")
        .update({
          status,
          aprovado_por: session.session?.user?.id,
          aprovador_nome: aprovadorNome,
          data_aprovacao: new Date().toISOString(),
          motivo_recusa: motivo_recusa || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aits"] });
      queryClient.invalidateQueries({ queryKey: ["ait-stats"] });
    },
  });
};

export const useDeleteAllAITs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("aits")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all rows

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aits"] });
      queryClient.invalidateQueries({ queryKey: ["ait-stats"] });
    },
  });
};

export const useDeleteAIT = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("aits")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aits"] });
      queryClient.invalidateQueries({ queryKey: ["ait-stats"] });
    },
  });
};
