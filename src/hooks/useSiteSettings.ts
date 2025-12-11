import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface AboutPageSettings {
  title: string;
  subtitle: string;
  mission_title: string;
  mission_text: string;
  vision_title: string;
  vision_text: string;
  values: Array<{ title: string; description: string }>;
  areas: Array<{ title: string; description: string }>;
}

export const useSiteSettings = (key: string) => {
  return useQuery({
    queryKey: ["site-settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", key)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // No rows found
        throw error;
      }
      return data;
    },
  });
};

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("key", key)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from("site_settings")
          .update({ value })
          .eq("key", key)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("site_settings")
          .insert([{ key, value }])
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["site-settings", variables.key] });
    },
  });
};
