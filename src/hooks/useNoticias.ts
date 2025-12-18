import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Noticia {
  id: string;
  titulo: string;
  subtitulo: string | null;
  descricao: string | null;
  imagem_url: string | null;
  ativa: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useNoticias = (apenasAtivas = true) => {
  return useQuery({
    queryKey: ["noticias", apenasAtivas],
    queryFn: async () => {
      let query = supabase
        .from("noticias")
        .select("*")
        .order("created_at", { ascending: false });

      if (apenasAtivas) {
        query = query.eq("ativa", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Noticia[];
    },
  });
};

export const useCreateNoticia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      titulo: string;
      subtitulo?: string;
      descricao?: string;
      imagem_url?: string;
      created_by?: string;
    }) => {
      const { data: result, error } = await supabase
        .from("noticias")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noticias"] });
    },
  });
};

export const useUpdateNoticia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      titulo?: string;
      subtitulo?: string;
      descricao?: string;
      imagem_url?: string;
      ativa?: boolean;
    }) => {
      const { data: result, error } = await supabase
        .from("noticias")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noticias"] });
    },
  });
};

export const useDeleteNoticia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("noticias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noticias"] });
    },
  });
};
