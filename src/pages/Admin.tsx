import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, Eye, EyeOff, User, Loader2, IdCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCheckPermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  nome: z.string().trim().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

const signupSchema = z.object({
  rg: z.string().trim().min(1, { message: "RG é obrigatório" }),
  nome: z.string().trim().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, signIn, signUp } = useAuth();
  const { hasPermission, isLoading: permissionsLoading } = useCheckPermissions(user?.id);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState({
    rg: "",
    nome: "",
    password: "",
    confirmPassword: "",
  });

  // Load saved credentials
  useEffect(() => {
    const savedNome = localStorage.getItem("cptran_saved_nome");
    if (savedNome) {
      setCredentials(prev => ({ ...prev, nome: savedNome }));
      setRememberMe(true);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && !permissionsLoading && user) {
      if (hasPermission("acessar_dashboard")) {
        navigate("/dashboard");
      } else {
        navigate("/");
      }
    }
  }, [user, authLoading, permissionsLoading, hasPermission, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(credentials);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Save credentials if remember me is checked
    if (rememberMe) {
      localStorage.setItem("cptran_saved_nome", credentials.nome);
    } else {
      localStorage.removeItem("cptran_saved_nome");
    }

    setLoading(true);
    await signIn(credentials.nome, credentials.password);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse(credentials);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { error } = await signUp(credentials.rg, credentials.nome, credentials.password);
    setLoading(false);

    if (!error) {
      setIsSignUp(false);
      setCredentials({ rg: "", nome: credentials.nome, password: "", confirmPassword: "" });
    }
  };

  if (authLoading || (user && permissionsLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 relative">
            <img
              src="/lovable-uploads/9a715676-f9f4-44ed-a7bf-b35796584151.png"
              alt="Logo CPTran"
              className="w-full h-full object-contain animate-glow"
            />
          </div>
          <h1 className="font-display text-4xl font-bold">
            <span className="text-primary neon-text">CPTran</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {isSignUp ? "Criar nova conta no sistema" : "Faça login para acessar"}
          </p>
        </div>

        {/* Login/SignUp Card */}
        <div className="bg-card rounded-xl p-8 shadow-neon border border-primary/20 animate-pulse-neon">
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="rg" className="text-foreground">Registro Geral (RG)</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input
                    id="rg"
                    type="text"
                    placeholder="Seu RG"
                    className="pl-10 bg-background border-border/50 focus:border-primary"
                    value={credentials.rg}
                    onChange={(e) => setCredentials({ ...credentials, rg: e.target.value })}
                  />
                </div>
                {errors.rg && <p className="text-xs text-destructive">{errors.rg}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nome" className="text-foreground">Nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome completo"
                  className="pl-10 bg-background border-border/50 focus:border-primary"
                  value={credentials.nome}
                  onChange={(e) => setCredentials({ ...credentials, nome: e.target.value })}
                />
              </div>
              {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 bg-background border-border/50 focus:border-primary"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirmar Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 bg-background border-border/50 focus:border-primary"
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
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Lembrar meu nome
                </label>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon font-semibold"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSignUp ? "Criar Conta" : "Entrar"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
              }}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              {isSignUp ? "Já tem uma conta? Faça login" : "Não tem conta? Cadastre-se"}
            </button>
          </div>

          <div className="mt-4 text-center">
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Voltar para o site
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-xs mt-6">
          {isSignUp 
            ? "Ao criar uma conta, você concorda com os termos de uso" 
            : "Sistema de Gerenciamento CPTran"}
        </p>
      </div>
    </div>
  );
};

export default Admin;
