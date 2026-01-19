import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CTBArticle = {
  id: string;
  categoria: string;
  artigo: string;
  descricao: string;
  multa: boolean;
  retencao: boolean;
  remocao: boolean;
  apreensao: boolean;
  revogacao: boolean;
  prisao: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export type CTBArticleInsert = Omit<CTBArticle, "id" | "created_at" | "updated_at" | "ordem"> & {
  created_by?: string | null;
  ordem?: number;
};

export type CTBArticleUpdate = Partial<CTBArticleInsert> & { ordem?: number };

export const useCTBArticles = () => {
  return useQuery({
    queryKey: ["ctb-artigos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ctb_artigos")
        .select("*")
        .order("ordem", { ascending: true })
        .order("categoria", { ascending: true })
        .order("artigo", { ascending: true });

      if (error) throw error;
      return (data ?? []) as CTBArticle[];
    },
  });
};

export const useCreateCTBArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CTBArticleInsert) => {
      const { data: auth } = await supabase.auth.getUser();
      const created_by = auth.user?.id ?? null;

      // Append new articles to the end of the global ordering
      const { data: last, error: lastErr } = await supabase
        .from("ctb_artigos")
        .select("ordem")
        .order("ordem", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (lastErr) throw lastErr;
      const ordem = (last?.ordem ?? -1) + 1;

      const { data, error } = await supabase
        .from("ctb_artigos")
        .insert({ ...payload, created_by, ordem })
        .select("*")
        .single();

      if (error) throw error;
      return data as CTBArticle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ctb-artigos"] });
    },
  });
};

export const useUpdateCTBArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: CTBArticleUpdate }) => {
      const { data, error } = await supabase
        .from("ctb_artigos")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;
      return data as CTBArticle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ctb-artigos"] });
    },
  });
};

export const useDeleteCTBArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ctb_artigos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ctb-artigos"] });
    },
  });
};

export const useReorderCTBArticles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderedIds }: { orderedIds: string[] }) => {
      // Update ordem sequentially for the whole list (global ordering)
      const results = await Promise.all(
        orderedIds.map((id, idx) =>
          supabase
            .from("ctb_artigos")
            .update({ ordem: idx })
            .eq("id", id)
        )
      );

      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ctb-artigos"] });
    },
  });
};
