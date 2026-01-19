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

export type CTBArticleInsert = Omit<CTBArticle, "id" | "created_at" | "updated_at"> & {
  created_by?: string | null;
};

export type CTBArticleUpdate = Partial<CTBArticleInsert>;

export const useCTBArticles = () => {
  return useQuery({
    queryKey: ["ctb-artigos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ctb_artigos")
        .select("*")
        .order("categoria", { ascending: true })
        .order("ordem", { ascending: true })
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

      const { data, error } = await supabase
        .from("ctb_artigos")
        .insert({ ...payload, created_by })
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
    mutationFn: async ({ categoria, orderedIds }: { categoria: string; orderedIds: string[] }) => {
      // Update ordem sequentially within the given category.
      const results = await Promise.all(
        orderedIds.map((id, idx) =>
          supabase
            .from("ctb_artigos")
            .update({ ordem: idx })
            .eq("id", id)
            .eq("categoria", categoria)
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
