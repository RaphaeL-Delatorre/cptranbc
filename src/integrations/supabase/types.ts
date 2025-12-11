export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aits: {
        Row: {
          agente_id: string | null
          aprovado_por: string | null
          artigos_infringidos: string[]
          created_at: string
          data_aprovacao: string | null
          data_inicio: string | null
          data_termino: string | null
          emplacamento: string
          graduacao: Database["public"]["Enums"]["patente"]
          id: string
          imagens: string[] | null
          marca_modelo: string
          motivo_recusa: string | null
          nome_agente: string
          nome_condutor: string
          nome_proprietario: string | null
          numero_ait: number
          passaporte_condutor: string
          passaporte_proprietario: string | null
          primeiro_homem: string
          primeiro_homem_patente: Database["public"]["Enums"]["patente"] | null
          providencias_tomadas: string[]
          quarto_homem: string | null
          quarto_homem_patente: Database["public"]["Enums"]["patente"] | null
          relatorio: string
          segundo_homem: string | null
          segundo_homem_patente: Database["public"]["Enums"]["patente"] | null
          status: Database["public"]["Enums"]["ait_status"]
          terceiro_homem: string | null
          terceiro_homem_patente: Database["public"]["Enums"]["patente"] | null
          updated_at: string
          viatura: string
        }
        Insert: {
          agente_id?: string | null
          aprovado_por?: string | null
          artigos_infringidos?: string[]
          created_at?: string
          data_aprovacao?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          emplacamento: string
          graduacao: Database["public"]["Enums"]["patente"]
          id?: string
          imagens?: string[] | null
          marca_modelo: string
          motivo_recusa?: string | null
          nome_agente: string
          nome_condutor: string
          nome_proprietario?: string | null
          numero_ait?: number
          passaporte_condutor: string
          passaporte_proprietario?: string | null
          primeiro_homem: string
          primeiro_homem_patente?: Database["public"]["Enums"]["patente"] | null
          providencias_tomadas?: string[]
          quarto_homem?: string | null
          quarto_homem_patente?: Database["public"]["Enums"]["patente"] | null
          relatorio: string
          segundo_homem?: string | null
          segundo_homem_patente?: Database["public"]["Enums"]["patente"] | null
          status?: Database["public"]["Enums"]["ait_status"]
          terceiro_homem?: string | null
          terceiro_homem_patente?: Database["public"]["Enums"]["patente"] | null
          updated_at?: string
          viatura: string
        }
        Update: {
          agente_id?: string | null
          aprovado_por?: string | null
          artigos_infringidos?: string[]
          created_at?: string
          data_aprovacao?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          emplacamento?: string
          graduacao?: Database["public"]["Enums"]["patente"]
          id?: string
          imagens?: string[] | null
          marca_modelo?: string
          motivo_recusa?: string | null
          nome_agente?: string
          nome_condutor?: string
          nome_proprietario?: string | null
          numero_ait?: number
          passaporte_condutor?: string
          passaporte_proprietario?: string | null
          primeiro_homem?: string
          primeiro_homem_patente?: Database["public"]["Enums"]["patente"] | null
          providencias_tomadas?: string[]
          quarto_homem?: string | null
          quarto_homem_patente?: Database["public"]["Enums"]["patente"] | null
          relatorio?: string
          segundo_homem?: string | null
          segundo_homem_patente?: Database["public"]["Enums"]["patente"] | null
          status?: Database["public"]["Enums"]["ait_status"]
          terceiro_homem?: string | null
          terceiro_homem_patente?: Database["public"]["Enums"]["patente"] | null
          updated_at?: string
          viatura?: string
        }
        Relationships: []
      }
      hierarquia: {
        Row: {
          created_at: string
          data_entrada: string
          funcao: string
          id: string
          nome: string
          observacao: string | null
          patente: Database["public"]["Enums"]["patente"]
          rg: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_entrada: string
          funcao: string
          id?: string
          nome: string
          observacao?: string | null
          patente: Database["public"]["Enums"]["patente"]
          rg: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_entrada?: string
          funcao?: string
          id?: string
          nome?: string
          observacao?: string | null
          patente?: Database["public"]["Enums"]["patente"]
          rg?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      viaturas: {
        Row: {
          ativa: boolean | null
          created_at: string
          id: string
          prefixo: string
          tipo: string
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string
          id?: string
          prefixo: string
          tipo: string
        }
        Update: {
          ativa?: boolean | null
          created_at?: string
          id?: string
          prefixo?: string
          tipo?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ait_status: "pendente" | "aprovado" | "recusado"
      app_role: "admin" | "moderador"
      patente:
        | "Coronel"
        | "Tenente-Coronel"
        | "Major"
        | "Capitão"
        | "1° Tenente"
        | "2° Tenente"
        | "Aspirante a Oficial"
        | "Subtenente"
        | "1° Sargento"
        | "2° Sargento"
        | "3° Sargento"
        | "Cabo"
        | "Soldado de 1° Classe"
        | "Soldado de 2° Classe"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ait_status: ["pendente", "aprovado", "recusado"],
      app_role: ["admin", "moderador"],
      patente: [
        "Coronel",
        "Tenente-Coronel",
        "Major",
        "Capitão",
        "1° Tenente",
        "2° Tenente",
        "Aspirante a Oficial",
        "Subtenente",
        "1° Sargento",
        "2° Sargento",
        "3° Sargento",
        "Cabo",
        "Soldado de 1° Classe",
        "Soldado de 2° Classe",
      ],
    },
  },
} as const
