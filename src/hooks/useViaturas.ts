import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Viatura {
  id: string;
  prefixo: string;
  tipo: string;
  ativa: boolean;
  created_at: string;
}

export const useViaturas = () => {
  return useQuery({
    queryKey: ["viaturas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viaturas")
        .select("*")
        .eq("ativa", true)
        .order("prefixo", { ascending: true });

      if (error) throw error;
      return data as Viatura[];
    },
  });
};
