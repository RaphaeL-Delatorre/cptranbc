import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAITs, type AIT } from "@/hooks/useAITs";
import { useMeusPontos, formatDuration, type PontoEletronico } from "@/hooks/usePontoEletronico";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User, 
  Mail, 
  Key, 
  FileText, 
  Eye,
  Check,
  X,
  Loader2,
  Edit,
  Save,
  Download,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { exportAITToPDF } from "@/utils/pdfExport";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type ProfileTab = "aits" | "pontos";

export const MyProfileContent = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: aits = [], isLoading: aitsLoading } = useAITs();
  const { data: pontos = [], isLoading: pontosLoading } = useMeusPontos();
  
  const [profileTab, setProfileTab] = useState<ProfileTab>("aits");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    nome: "",
    email: user?.email || ""
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  const [saving, setSaving] = useState(false);
  const [selectedAIT, setSelectedAIT] = useState<AIT | null>(null);
  const [selectedPonto, setSelectedPonto] = useState<PontoEletronico | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendente" | "aprovado" | "recusado">("todos");

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
        setProfileData(prev => ({ ...prev, nome: data.nome || "" }));
      }
    };
    
    loadProfile();
  }, [user?.id]);

  // Filter pontos created by this user
  const myPontos = pontos.filter(ponto => {
    if (statusFilter !== "todos" && ponto.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ponto.nome_policial?.toLowerCase().includes(term) ||
      ponto.viatura?.toLowerCase().includes(term)
    );
  });

  // Filter AITs created by this user
  const myAITs = aits.filter(ait => {
    if (ait.agente_id !== user?.id) return false;
    if (statusFilter !== "todos" && ait.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ait.nome_condutor.toLowerCase().includes(term) ||
      ait.emplacamento.toLowerCase().includes(term) ||
      ait.numero_ait.toString().includes(term)
    );
  });

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
          email: profileData.email
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
        password: passwordData.newPassword
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary">Pendente</span>;
      case "aprovado":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-success/20 text-success">Aprovado</span>;
      case "recusado":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-destructive/20 text-destructive">Recusado</span>;
      default:
        return null;
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
              <Button variant="outline" onClick={() => {
                setIsChangingPassword(false);
                setPasswordData({ newPassword: "", confirmPassword: "" });
              }}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* My AITs & Pontos Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {profileTab === "aits" ? <FileText className="h-5 w-5 text-primary" /> : <Clock className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">
                {profileTab === "aits" ? "Meus AITs" : "Meus Pontos"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {profileTab === "aits" ? "Histórico de AITs" : "Histórico de Pontos Eletrônicos"}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex gap-1">
              <Button 
                variant={profileTab === "aits" ? "default" : "outline"} 
                size="sm"
                onClick={() => { setProfileTab("aits"); setSearchTerm(""); setStatusFilter("todos"); }}
              >
                <FileText className="h-4 w-4 mr-1" />
                AITs
              </Button>
              <Button 
                variant={profileTab === "pontos" ? "default" : "outline"} 
                size="sm"
                onClick={() => { setProfileTab("pontos"); setSearchTerm(""); setStatusFilter("todos"); }}
              >
                <Clock className="h-4 w-4 mr-1" />
                Pontos
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar..." 
                className="pl-9 w-48" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: typeof statusFilter) => setStatusFilter(v)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="aprovado">Aprovados</SelectItem>
                <SelectItem value="recusado">Recusados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* AITs Tab */}
        {profileTab === "aits" && (
          <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
            {aitsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : myAITs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm ? "Nenhum AIT encontrado." : "Você ainda não criou nenhum AIT."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-sm">Nº do AIT</th>
                      <th className="text-left p-4 font-semibold text-sm">Data</th>
                      <th className="text-left p-4 font-semibold text-sm">Viatura</th>
                      <th className="text-left p-4 font-semibold text-sm">Situação</th>
                      <th className="text-left p-4 font-semibold text-sm">Responsável</th>
                      <th className="text-right p-4 font-semibold text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {myAITs.map((ait) => (
                      <tr key={ait.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium">#{ait.numero_ait}</td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(ait.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="p-4">{ait.viatura || "-"}</td>
                        <td className="p-4">{getStatusBadge(ait.status)}</td>
                        <td className="p-4 text-sm">{ait.aprovador_nome || "-"}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button size="icon" variant="ghost" onClick={() => setSelectedAIT(ait)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => exportAITToPDF(ait)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pontos Tab */}
        {profileTab === "pontos" && (
          <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
            {pontosLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : myPontos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {searchTerm ? "Nenhum ponto encontrado." : "Você ainda não registrou nenhum ponto."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-sm">Data</th>
                      <th className="text-left p-4 font-semibold text-sm">Função</th>
                      <th className="text-left p-4 font-semibold text-sm">Viatura</th>
                      <th className="text-left p-4 font-semibold text-sm">Duração</th>
                      <th className="text-left p-4 font-semibold text-sm">Situação</th>
                      <th className="text-left p-4 font-semibold text-sm">Responsável</th>
                      <th className="text-right p-4 font-semibold text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {myPontos.map((ponto) => (
                      <tr key={ponto.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4 text-muted-foreground">
                          {new Date(ponto.created_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="p-4 capitalize">{ponto.funcao}</td>
                        <td className="p-4">{ponto.viatura || "-"}</td>
                        <td className="p-4 font-mono">
                          {ponto.tempo_total_segundos ? formatDuration(ponto.tempo_total_segundos) : "-"}
                        </td>
                        <td className="p-4">{getStatusBadge(ponto.status)}</td>
                        <td className="p-4 text-sm">{ponto.aprovador_nome || "-"}</td>
                        <td className="p-4 text-right">
                          <Button size="icon" variant="ghost" onClick={() => setSelectedPonto(ponto)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AIT Detail Modal (mesmo padrão do Dashboard) */}
      {selectedAIT && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-2xl font-bold">AIT #{selectedAIT.numero_ait}</h3>
                <p className="text-sm text-muted-foreground">
                  Criado em {new Date(selectedAIT.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedAIT.status)}
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => exportAITToPDF(selectedAIT)}
                  title="Exportar PDF"
                >
                  <Download className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setSelectedAIT(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                <h4 className="font-semibold text-primary text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Policial Responsável
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Graduação</p>
                    <p className="font-semibold">{selectedAIT.graduacao}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-semibold">{selectedAIT.nome_agente}</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                <h4 className="font-semibold text-primary text-lg">Viatura e Equipe</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Viatura</p>
                    <p className="font-semibold">{selectedAIT.viatura}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Motorista</p>
                    <p className="font-semibold">{selectedAIT.primeiro_homem}</p>
                  </div>
                  {selectedAIT.segundo_homem && (
                    <div>
                      <p className="text-sm text-muted-foreground">Encarregado</p>
                      <p className="font-semibold">{selectedAIT.segundo_homem}</p>
                    </div>
                  )}
                  {selectedAIT.terceiro_homem && (
                    <div>
                      <p className="text-sm text-muted-foreground">3º Homem</p>
                      <p className="font-semibold">{selectedAIT.terceiro_homem}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                <h4 className="font-semibold text-primary text-lg">Veículo e Envolvidos</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Placa</p>
                    <p className="font-semibold font-mono">{selectedAIT.emplacamento}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Modelo</p>
                    <p className="font-semibold">{selectedAIT.marca_modelo}</p>
                  </div>
                  {selectedAIT.nome_condutor && (
                    <div>
                      <p className="text-sm text-muted-foreground">Motorista</p>
                      <p className="font-semibold">{selectedAIT.nome_condutor}</p>
                    </div>
                  )}
                  {selectedAIT.nome_proprietario && (
                    <div>
                      <p className="text-sm text-muted-foreground">Proprietário</p>
                      <p className="font-semibold">{selectedAIT.nome_proprietario}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                <h4 className="font-semibold text-primary text-lg">Infrações e Providências</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Artigos Infringidos</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAIT.artigos_infringidos?.map((art) => (
                        <span key={art} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                          {art}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Providências</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAIT.providencias_tomadas?.map((prov) => (
                        <span key={prov} className="px-3 py-1 bg-secondary/10 text-secondary rounded-lg text-sm font-medium">
                          {prov}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {(selectedAIT.aprovador_nome || selectedAIT.motivo_recusa) && (
                <div
                  className={`rounded-xl p-5 space-y-4 ${
                    selectedAIT.status === "recusado" ? "bg-destructive/10" : "bg-success/10"
                  }`}
                >
                  <h4
                    className={`font-semibold text-lg ${
                      selectedAIT.status === "recusado" ? "text-destructive" : "text-success"
                    }`}
                  >
                    {selectedAIT.status === "aprovado" ? "Aprovação" : "Reprovação"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAIT.aprovador_nome && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {selectedAIT.status === "aprovado" ? "Aprovado por" : "Reprovado por"}
                        </p>
                        <p className="font-semibold">{selectedAIT.aprovador_nome}</p>
                      </div>
                    )}
                    {selectedAIT.data_aprovacao && (
                      <div>
                        <p className="text-sm text-muted-foreground">Data</p>
                        <p className="font-semibold">{new Date(selectedAIT.data_aprovacao).toLocaleString("pt-BR")}</p>
                      </div>
                    )}
                  </div>
                  {selectedAIT.motivo_recusa && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Motivo</p>
                      <p className="bg-background/50 p-3 rounded-lg">{selectedAIT.motivo_recusa}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                <h4 className="font-semibold text-primary text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Imagens, Data e Relatório
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data da ocorrência</p>
                    <p className="font-semibold">
                      {selectedAIT.data_inicio ? new Date(selectedAIT.data_inicio).toLocaleString("pt-BR") : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Criado em</p>
                    <p className="font-semibold">{new Date(selectedAIT.created_at).toLocaleString("pt-BR")}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Relatório</p>
                  <p className="bg-background/50 p-3 rounded-lg whitespace-pre-wrap">
                    {selectedAIT.relatorio?.trim() ? selectedAIT.relatorio : "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Imagens</p>
                  {selectedAIT.imagens && selectedAIT.imagens.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {selectedAIT.imagens.map((imgPath, idx) => {
                        const imageUrl = imgPath.startsWith("http")
                          ? imgPath
                          : supabase.storage.from("ait-images").getPublicUrl(imgPath).data.publicUrl;

                        return (
                          <a
                            key={idx}
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square rounded-lg overflow-hidden border"
                          >
                            <img
                              src={imageUrl}
                              alt={`Imagem do AIT #${selectedAIT.numero_ait} (${idx + 1})`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          </a>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma imagem anexada.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ponto Detail Modal (mesmo padrão do Dashboard) */}
      {selectedPonto && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-2xl font-bold">Detalhes do Ponto</h3>
                <p className="text-sm text-muted-foreground">
                  Iniciado em {new Date(selectedPonto.data_inicio).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedPonto.status)}
                <Button size="icon" variant="ghost" onClick={() => setSelectedPonto(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                <h4 className="font-semibold text-primary text-lg">Policial</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-semibold">{selectedPonto.nome_policial || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Patente</p>
                    <p className="font-semibold">{selectedPonto.patente || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Função</p>
                    <p className="font-semibold">{selectedPonto.funcao}</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                <h4 className="font-semibold text-primary text-lg">Serviço</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Viatura</p>
                    <p className="font-semibold">{selectedPonto.viatura || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ponto Discord</p>
                    <p className="font-semibold">{selectedPonto.ponto_discord || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Início</p>
                    <p className="font-semibold">{new Date(selectedPonto.data_inicio).toLocaleString("pt-BR")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fim</p>
                    <p className="font-semibold">
                      {selectedPonto.data_fim ? new Date(selectedPonto.data_fim).toLocaleString("pt-BR") : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Duração Total</p>
                  <p className="font-semibold text-xl font-mono">
                    {formatDuration(selectedPonto.tempo_total_segundos || 0)}
                  </p>
                </div>

                {selectedPonto.observacao && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observação</p>
                    <p className="bg-background/50 p-3 rounded-lg">{selectedPonto.observacao}</p>
                  </div>
                )}
              </div>

              {(selectedPonto.aprovador_nome || selectedPonto.motivo_recusa) && (
                <div
                  className={`rounded-xl p-5 space-y-4 ${
                    selectedPonto.status === "recusado" ? "bg-destructive/10" : "bg-success/10"
                  }`}
                >
                  <h4
                    className={`font-semibold text-lg ${
                      selectedPonto.status === "recusado" ? "text-destructive" : "text-success"
                    }`}
                  >
                    {selectedPonto.status === "aprovado" ? "Aprovação" : "Reprovação"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPonto.aprovador_nome && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {selectedPonto.status === "aprovado" ? "Aprovado por" : "Recusado por"}
                        </p>
                        <p className="font-semibold">{selectedPonto.aprovador_nome}</p>
                      </div>
                    )}
                    {selectedPonto.data_aprovacao && (
                      <div>
                        <p className="text-sm text-muted-foreground">Data</p>
                        <p className="font-semibold">
                          {new Date(selectedPonto.data_aprovacao).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedPonto.motivo_recusa && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Motivo</p>
                      <p className="bg-background/50 p-3 rounded-lg">{selectedPonto.motivo_recusa}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
