import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        let message = "Erro ao fazer login.";
        if (error.message.includes("Invalid login credentials")) {
          message = "E-mail ou senha incorretos.";
        } else if (error.message.includes("Email not confirmed")) {
          message = "E-mail não confirmado. Verifique sua caixa de entrada.";
        }
        toast({
          title: "Erro no login",
          description: message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta.",
      });
      return { data, error: null };
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUp = async (email: string, password: string, nome: string, rg?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome,
            rg: rg ?? "",
          },
        },
      });

      if (error) {
        // Friendly errors (including leaked-password protection and profile unique constraints)
        const anyErr: any = error as any;
        const raw = `${anyErr?.message ?? ""} ${anyErr?.code ?? ""}`.toLowerCase();

        let message = "Erro ao criar conta.";

        if (anyErr?.code === "weak_password" || raw.includes("weak_password") || raw.includes("pwned")) {
          message = "Senha fraca ou vazada. Use uma senha mais forte (mín. 8 caracteres, com letras e números).";
        } else if (raw.includes("profiles_rg_unique") || raw.includes("unique constraint \"profiles_rg_unique\"") || raw.includes("duplicate key value")) {
          message = "Este RG já está cadastrado.";
        } else if (raw.includes("profiles_email_unique")) {
          message = "Este e-mail já está registrado.";
        } else if (raw.includes("already registered")) {
          message = "Este e-mail já está registrado.";
        } else if (raw.includes("password")) {
          message = "A senha é inválida. Use uma senha mais forte.";
        }

        toast({
          title: "Erro no cadastro",
          description: message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Conta criada!",
        description: "Você já pode fazer login.",
      });
      return { data, error: null };
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado.",
      });
    }
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
};
