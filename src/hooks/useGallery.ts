import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GalleryImage {
  id: string;
  image_url: string;
  title: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const useGallery = () => {
  return useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gallery_images")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as GalleryImage[];
    },
  });
};

export const useCreateGalleryImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { image_url: string; title?: string; display_order?: number }) => {
      const { data: result, error } = await supabase
        .from("gallery_images")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
};

export const useUpdateGalleryImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; image_url?: string; title?: string; display_order?: number }) => {
      const { data: result, error } = await supabase
        .from("gallery_images")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
};

export const useDeleteGalleryImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
    },
  });
};
