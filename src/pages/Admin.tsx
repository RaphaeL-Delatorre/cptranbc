import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Eye, EyeOff, User, Loader2, IdCard } from "lucide-react";
import logoTransito from "@/assets/logo-transito.png";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useRoles";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const loginSchema = z.object({
  rg: z
    .string()
    .trim()
    .regex(/^\d+$/, { message: "RG deve conter apenas números" })
    .min(1, { message: "Informe o RG" })
    .max(30, { message: "RG muito longo" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

const signupSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(3, { message: "Informe Nome e Sobrenome" })
      .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, {
        message: "Informe Nome e Sobrenome",
      }),
    rg: z
      .string()
      .trim()
      .regex(/^\d+$/, { message: "RG deve conter apenas números" })
      .min(1, { message: "Informe o RG" })
      .max(30, { message: "RG muito longo" }),
    password: z
      .string()
      .min(8, { message: "Senha deve ter pelo menos 8 caracteres" })
      .regex(/[A-Za-z]/, { message: "Senha deve conter letras" })
      .regex(/\d/, { message: "Senha deve conter números" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const { data: userRoles = [], isLoading: rolesLoading } = useUserRoles(user?.id);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState({
    rg: "",
    password: "",
    confirmPassword: "",
    nome: "",
  });

  const emailPreview = useMemo(() => {
    const nome = credentials.nome.trim();
    if (!nome) return "";
    const normalized = nome
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .trim()
      .replace(/\s+/g, " ");
    const parts = normalized.split(" ").filter(Boolean);
    if (parts.length < 2) return "";
    return `${parts[0]}.${parts[parts.length - 1]}@cptran.gov.br`;
  }, [credentials.nome]);

  // Load saved RG on mount
  useEffect(() => {
    const savedRg = localStorage.getItem("savedRg");
    if (savedRg) {
      setCredentials((prev) => ({ ...prev, rg: savedRg }));
      setRememberMe(true);
    }
  }, []);

  // Determine user role
  const userRole = userRoles.find(r => r.role === "admin") ? "admin" : 
                   userRoles.find(r => r.role === "moderador") ? "moderador" : null;

  // Redirect if already authenticated based on role
  useEffect(() => {
    if (!authLoading && !rolesLoading && user) {
      if (userRole) {
        navigate("/dashboard");
      } else {
        // User is logged in but has no admin/moderador role
        toast({
          title: "Acesso restrito",
          description: "Você não tem permissão para acessar o painel administrativo.",
          variant: "destructive",
        });
        navigate("/");
      }
    }
  }, [user, authLoading, rolesLoading, userRole, navigate, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(credentials);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    // Save RG if remember me is checked
    if (rememberMe) {
      localStorage.setItem("savedRg", credentials.rg);
    } else {
      localStorage.removeItem("savedRg");
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("rg", credentials.rg)
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.email) {
        toast({ title: "Erro no login", description: "RG não encontrado.", variant: "destructive" });
        setLoading(false);
        return;
      }

      await signIn(profile.email, credentials.password);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao fazer login.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse(credentials);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    if (!emailPreview) {
      toast({ title: "Erro", description: "Informe Nome e Sobrenome.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Impedir mesmo Nome+Sobrenome (email) e mesmo RG
      const { data: existsByRg, error: rgErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("rg", credentials.rg)
        .maybeSingle();
      if (rgErr) throw rgErr;
      if (existsByRg) {
        toast({ title: "Erro no cadastro", description: "Este RG já está cadastrado.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { data: existsByEmail, error: emailErr } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", emailPreview)
        .maybeSingle();
      if (emailErr) throw emailErr;
      if (existsByEmail) {
        toast({ title: "Erro no cadastro", description: "Nome e Sobrenome já existente no sistema.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { error } = await signUp(emailPreview, credentials.password, credentials.nome, credentials.rg);
      if (!error) {
        setIsSignUp(false);
        setCredentials({ rg: credentials.rg, password: "", confirmPassword: "", nome: "" });
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao criar conta.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (user && rolesLoading)) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={logoTransito}
            alt="Logo Trânsito"
            className="mx-auto h-20 w-20 object-contain mb-4"
          />
          <h1 className="font-display text-3xl font-bold text-secondary-foreground">
            <span className="text-primary">ADMINISTRATIVO</span>
          </h1>
          <p className="text-secondary-foreground/70 text-sm mt-2">
            {isSignUp ? "Criar nova conta no sistema" : "Faça login para acessar o sistema"}
          </p>
        </div>

        {/* Login/SignUp Card */}
        <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50">
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="nome">Nome e Sobrenome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Ex.: Rafael Delatorre"
                    className="pl-10"
                    value={credentials.nome}
                    onChange={(e) => setCredentials({ ...credentials, nome: e.target.value })}
                  />
                </div>
                {emailPreview && (
                  <p className="text-xs text-muted-foreground">Email: {emailPreview}</p>
                )}
                {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="rg">RG</Label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="rg"
                  inputMode="numeric"
                  placeholder="Somente números"
                  className="pl-10"
                  value={credentials.rg}
                  onChange={(e) => setCredentials({ ...credentials, rg: e.target.value })}
                />
              </div>
              {errors.rg && <p className="text-xs text-destructive">{errors.rg}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10"
                    value={credentials.confirmPassword}
                    onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                  />
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                  Lembrar meu RG
                </Label>
              </div>
            )}

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSignUp ? "Criar Conta" : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
              }}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? "Já tem uma conta? Faça login" : "Não tem conta? Cadastre-se"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <a href="/" className="text-sm text-muted-foreground hover:underline">
              Voltar para o site
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-secondary-foreground/50 text-xs mt-6">
          {isSignUp 
            ? "Ao criar uma conta, você aceita os termos de uso" 
            : "O painel administrativo é restrito a moderadores e administradores"}
        </p>
      </div>
    </div>
  );
};

export default Admin;