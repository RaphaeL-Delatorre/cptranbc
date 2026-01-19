import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserCargosPermissoes } from "@/hooks/useCargosPermissoes";
import {
  User,
  Mail,
  Key,
  Shield,
  Check,
  Loader2,
  Edit,
  Save,
} from "lucide-react";

type ProfileTab = "cargos" | "permissoes";

export const MyProfileContent = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: cargosPerms, isLoading: cargosPermsLoading } = useUserCargosPermissoes(user?.id);

  const [profileTab, setProfileTab] = useState<ProfileTab>("cargos");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    nome: "",
    email: user?.email || "",
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [saving, setSaving] = useState(false);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from("profiles")
        .select("nome")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setProfileData((prev) => ({ ...prev, nome: data.nome || "" }));
      }
    };

    loadProfile();
  }, [user?.id]);

  const handleUpdateProfile = async () => {
    if (!profileData.nome.trim() && !profileData.email.trim()) {
      toast({ title: "Erro", description: "Preencha pelo menos um campo.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // Update email in auth if changed
      if (profileData.email && profileData.email !== user?.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: profileData.email,
        });
        if (authError) throw authError;
      }

      // Update nome in profiles table
      if (profileData.nome.trim()) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ nome: profileData.nome })
          .eq("user_id", user?.id);

        if (profileError) throw profileError;
      }

      toast({ title: "Perfil Atualizado", description: "Suas informações foram atualizadas com sucesso." });
      setIsEditingProfile(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Erro ao atualizar perfil.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({ title: "Senha Alterada", description: "Sua senha foi alterada com sucesso." });
      setIsChangingPassword(false);
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Erro ao alterar senha.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Meu Perfil</h2>

      {/* Profile Info Card */}
      <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">
                {profileData.nome?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold">{profileData.nome || user?.email}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setIsEditingProfile(!isEditingProfile)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
        </div>

        {isEditingProfile && (
          <div className="border-t border-border/50 pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">
                  <User className="h-4 w-4 inline mr-2" />
                  Nome
                </Label>
                <Input
                  id="nome"
                  value={profileData.nome}
                  onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateProfile} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Alterar Senha</h3>
              <p className="text-sm text-muted-foreground">Atualize sua senha de acesso</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setIsChangingPassword(!isChangingPassword)}>
            Alterar Senha
          </Button>
        </div>

        {isChangingPassword && (
          <div className="border-t border-border/50 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newPassword">Nova Senha</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleChangePassword} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                Alterar Senha
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordData({ newPassword: "", confirmPassword: "" });
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Cargo & Permissões */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">
                {profileTab === "cargos" && "Meu Cargo"}
                {profileTab === "permissoes" && "Minhas Permissões"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {profileTab === "cargos" && "Cargos atribuídos ao seu usuário"}
                {profileTab === "permissoes" && "Permissões efetivas a partir dos seus cargos"}
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex gap-1">
              <Button
                variant={profileTab === "cargos" ? "default" : "outline"}
                size="sm"
                onClick={() => setProfileTab("cargos")}
              >
                <Shield className="h-4 w-4 mr-1" />
                Cargo
              </Button>
              <Button
                variant={profileTab === "permissoes" ? "default" : "outline"}
                size="sm"
                onClick={() => setProfileTab("permissoes")}
              >
                <Key className="h-4 w-4 mr-1" />
                Permissões
              </Button>
            </div>
          </div>
        </div>

        {/* Cargos Tab */}
        {profileTab === "cargos" && (
          <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
            {cargosPermsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : (cargosPerms?.cargos?.length ?? 0) === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhum cargo atribuído.</div>
            ) : (
              <div className="divide-y divide-border/50">
                {cargosPerms!.cargos.map((cargo) => (
                  <div key={cargo.id} className="p-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold">{cargo.nome}</div>
                      {cargo.descricao && <div className="text-sm text-muted-foreground">{cargo.descricao}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Permissões Tab */}
        {profileTab === "permissoes" && (
          <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
            {cargosPermsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : (cargosPerms?.permissoes?.length ?? 0) === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhuma permissão encontrada.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-sm">Categoria</th>
                      <th className="text-left p-4 font-semibold text-sm">Permissão</th>
                      <th className="text-left p-4 font-semibold text-sm">Código</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {cargosPerms!.permissoes.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-muted-foreground">{p.categoria}</td>
                        <td className="p-4 font-medium">{p.nome}</td>
                        <td className="p-4 font-mono text-sm text-muted-foreground">{p.codigo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
