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

  // Sign in with nome (looks up email by nome first)
  const signIn = async (nome: string, password: string) => {
    try {
      // First, find the user's email by nome
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("nome", nome.trim())
        .limit(1);

      if (profileError) {
        toast({
          title: "Erro no login",
          description: "Erro ao buscar usuário.",
          variant: "destructive",
        });
        return { error: profileError };
      }

      if (!profiles || profiles.length === 0) {
        toast({
          title: "Erro no login",
          description: "Usuário não encontrado.",
          variant: "destructive",
        });
        return { error: { message: "User not found" } };
      }

      const email = profiles[0].email;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let message = "Erro ao fazer login.";
        if (error.message.includes("Invalid login credentials")) {
          message = "Nome ou senha incorretos.";
        } else if (error.message.includes("Email not confirmed")) {
          message = "Conta não confirmada.";
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

  // Sign up with RG, nome, and password
  const signUp = async (rg: string, nome: string, password: string) => {
    try {
      // Generate email from RG
      const email = `${rg.replace(/\D/g, "")}@cptran.system`;
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            nome,
            rg,
          },
        },
      });

      if (error) {
        let message = "Erro ao criar conta.";
        if (error.message.includes("already registered")) {
          message = "Este RG já está registrado.";
        } else if (error.message.includes("password")) {
          message = "A senha deve ter pelo menos 6 caracteres.";
        }
        toast({
          title: "Erro no cadastro",
          description: message,
          variant: "destructive",
        });
        return { error };
      }

      // Wait for profile to be created by trigger, then update RG and assign cargo
      if (data.user) {
        // Use setTimeout to defer Supabase calls (avoid auth deadlock)
        setTimeout(async () => {
          try {
            // Update profile with RG
            await supabase
              .from("profiles")
              .update({ rg, nome })
              .eq("user_id", data.user!.id);

            // Assign default cargo (Membro)
            const { data: membroCargo } = await supabase
              .from("cargos")
              .select("id")
              .eq("nome", "Membro")
              .maybeSingle();

            if (membroCargo) {
              await supabase
                .from("usuario_cargos")
                .upsert({
                  user_id: data.user!.id,
                  cargo_id: membroCargo.id,
                }, { onConflict: 'user_id,cargo_id' });
            }
          } catch (err) {
            console.error("Error updating profile after signup:", err);
          }
        }, 500);
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
