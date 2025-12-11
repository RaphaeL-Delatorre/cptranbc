import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import logoTransito from "@/assets/logo-transito.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Setup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "admin@gmail.com",
    password: "12345678",
    nome: "Administrador",
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data } = await supabase.from("user_roles").select("*").eq("role", "admin");
    if (data && data.length > 0) {
      setHasAdmin(true);
    }
    setLoading(false);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Use edge function to create admin (bypasses RLS with service role)
      const response = await supabase.functions.invoke("create-admin", {
        body: { 
          email: credentials.email, 
          password: credentials.password, 
          nome: credentials.nome 
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Administrador criado!",
        description: "Faça login para acessar o dashboard.",
      });

      setTimeout(() => navigate("/admin"), 1500);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar administrador.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (hasAdmin) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Sistema já configurado</h1>
          <p className="text-muted-foreground mb-4">Já existe um administrador no sistema.</p>
          <Button onClick={() => navigate("/admin")}>Ir para Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={logoTransito} alt="Logo" className="mx-auto h-20 w-20 object-contain mb-4" />
          <h1 className="font-display text-3xl font-bold text-primary">CONFIGURAÇÃO INICIAL</h1>
          <p className="text-muted-foreground text-sm mt-2">Criar conta de administrador</p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={credentials.nome}
                onChange={(e) => setCredentials({ ...credentials, nome: e.target.value })}
              />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Administrador
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Setup;
