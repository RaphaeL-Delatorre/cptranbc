import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Eye,
  UserPlus,
  Shield,
  Search,
  Key,
  Loader2,
  Home,
  Download,
  Clock,
  Bell,
  Briefcase,
} from "lucide-react";
import logoCptran from "@/assets/logo-cptran.png";
import { useAITs, useAITStats, useUpdateAITStatus, useDeleteAllAITs, type AIT } from "@/hooks/useAITs";
import { useHierarquia, useCreateHierarquia, useUpdateHierarquia, useDeleteHierarquia, type HierarquiaMembro } from "@/hooks/useHierarquia";
import { patentes } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useRoles";
import { useUsers, useCreateUserWithRole, useAssignRole, useRemoveRole, useDeleteUser, useUpdateUserPassword, useUpdateUser, type UserWithRole } from "@/hooks/useUsers";
import { SettingsContent } from "@/components/dashboard/SettingsContent";
import { AITStatisticsCharts } from "@/components/dashboard/AITStatisticsCharts";
import { exportAITToPDF, exportAllAITsToPDF } from "@/utils/pdfExport";
import { usePontosEletronicos, useAprovarPonto, useRecusarPonto, useDeletePonto } from "@/hooks/usePontoEletronico";
import { useNoticias, useCreateNoticia, useUpdateNoticia, useDeleteNoticia } from "@/hooks/useNoticias";
import { useCargos, useCreateCargo, useUpdateCargo, useDeleteCargo, usePermissoes, useCargoPermissoes, useAddCargoPermissao, useRemoveCargoPermissao } from "@/hooks/usePermissions";

type TabType = "dashboard" | "hierarquia" | "ait" | "usuarios" | "ponto" | "noticias" | "cargos" | "config";

const Dashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: userRoles = [], isLoading: rolesLoading } = useUserRoles(user?.id);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [showAddHierarquia, setShowAddHierarquia] = useState(false);
  const [showAddUsuario, setShowAddUsuario] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState<string | null>(null);
  const [showEditUser, setShowEditUser] = useState<UserWithRole | null>(null);
  const [editUserData, setEditUserData] = useState({ nome: "", email: "" });
  const [newPassword, setNewPassword] = useState("");
  const [selectedAIT, setSelectedAIT] = useState<AIT | null>(null);
  const [editingHierarquia, setEditingHierarquia] = useState<HierarquiaMembro | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendente" | "aprovado" | "recusado">("todos");
  const [pontoStatusFilter, setPontoStatusFilter] = useState<"todos" | "pendente" | "aprovado" | "recusado">("todos");
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [recusandoPontoId, setRecusandoPontoId] = useState<string | null>(null);

  // Noticia states
  const [showAddNoticia, setShowAddNoticia] = useState(false);
  const [editingNoticia, setEditingNoticia] = useState<any>(null);
  const [noticiaForm, setNoticiaForm] = useState({ titulo: "", subtitulo: "", descricao: "", imagem_url: "", ativa: true });

  // Cargo states
  const [showAddCargo, setShowAddCargo] = useState(false);
  const [editingCargo, setEditingCargo] = useState<any>(null);
  const [cargoForm, setCargoForm] = useState({ nome: "", descricao: "", cor: "#FFD700", ordem: 0 });
  const [selectedCargoForPerms, setSelectedCargoForPerms] = useState<string | null>(null);

  // Determine user role
  const userRole = userRoles.find(r => r.role === "admin") ? "admin" : 
                   userRoles.find(r => r.role === "moderador") ? "moderador" : null;

  // Database hooks
  const { data: aits = [], isLoading: aitsLoading } = useAITs();
  const { data: stats } = useAITStats();
  const { data: hierarquia = [], isLoading: hierarquiaLoading } = useHierarquia();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: pontos = [], isLoading: pontosLoading } = usePontosEletronicos();
  const { data: noticias = [], isLoading: noticiasLoading } = useNoticias();
  const { data: cargos = [], isLoading: cargosLoading } = useCargos();
  const { data: permissoes = [] } = usePermissoes();
  const { data: cargoPermissoes = [] } = useCargoPermissoes();
  
  const updateAITStatus = useUpdateAITStatus();
  const deleteAllAITs = useDeleteAllAITs();
  const createHierarquia = useCreateHierarquia();
  const updateHierarquia = useUpdateHierarquia();
  const deleteHierarquia = useDeleteHierarquia();
  const createUserWithRole = useCreateUserWithRole();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const deleteUser = useDeleteUser();
  const updateUserPassword = useUpdateUserPassword();
  const updateUser = useUpdateUser();
  const aprovarPonto = useAprovarPonto();
  const recusarPonto = useRecusarPonto();
  const deletePonto = useDeletePonto();
  const createNoticia = useCreateNoticia();
  const updateNoticia = useUpdateNoticia();
  const deleteNoticia = useDeleteNoticia();
  const createCargo = useCreateCargo();
  const updateCargo = useUpdateCargo();
  const deleteCargo = useDeleteCargo();
  const addCargoPermissao = useAddCargoPermissao();
  const removeCargoPermissao = useRemoveCargoPermissao();

  const [newHierarquia, setNewHierarquia] = useState({
    nome: "",
    rg: "",
    patente: "",
    funcao: "",
    observacao: "",
    dataEntrada: "",
  });

  const [newUsuario, setNewUsuario] = useState({
    nome: "",
    email: "",
    senha: "",
    role: "moderador" as "admin" | "moderador",
  });

  // Redirect if not authenticated or doesn't have admin/moderador role
  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) {
        navigate("/admin");
      } else if (!userRole) {
        navigate("/");
      }
    }
  }, [user, authLoading, rolesLoading, userRole, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/admin");
  };

  const handleApproveAIT = async (id: string) => {
    try {
      await updateAITStatus.mutateAsync({ id, status: "aprovado" });
      toast({ title: "AIT Aprovado", description: `AIT foi aprovado com sucesso.` });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao aprovar AIT.", variant: "destructive" });
    }
  };

  const handleRejectAIT = async (id: string) => {
    try {
      await updateAITStatus.mutateAsync({ id, status: "recusado" });
      toast({ title: "AIT Recusado", description: `AIT foi recusado.`, variant: "destructive" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao recusar AIT.", variant: "destructive" });
    }
  };

  const handleAddHierarquia = async () => {
    if (!newHierarquia.nome || !newHierarquia.rg || !newHierarquia.patente || !newHierarquia.funcao || !newHierarquia.dataEntrada) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    try {
      await createHierarquia.mutateAsync({
        nome: newHierarquia.nome,
        rg: newHierarquia.rg,
        patente: newHierarquia.patente,
        funcao: newHierarquia.funcao,
        observacao: newHierarquia.observacao || undefined,
        data_entrada: newHierarquia.dataEntrada,
      });
      toast({ title: "Membro Adicionado", description: `${newHierarquia.nome} foi adicionado à hierarquia.` });
      setShowAddHierarquia(false);
      setNewHierarquia({ nome: "", rg: "", patente: "", funcao: "", observacao: "", dataEntrada: "" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao adicionar membro.", variant: "destructive" });
    }
  };

  const handleUpdateHierarquia = async () => {
    if (!editingHierarquia) return;

    try {
      await updateHierarquia.mutateAsync({
        id: editingHierarquia.id,
        nome: editingHierarquia.nome,
        rg: editingHierarquia.rg,
        patente: editingHierarquia.patente,
        funcao: editingHierarquia.funcao,
        observacao: editingHierarquia.observacao || undefined,
        data_entrada: editingHierarquia.data_entrada,
      });
      toast({ title: "Membro Atualizado", description: `${editingHierarquia.nome} foi atualizado.` });
      setEditingHierarquia(null);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao atualizar membro.", variant: "destructive" });
    }
  };

  const handleDeleteHierarquia = async (id: string, nome: string) => {
    try {
      await deleteHierarquia.mutateAsync(id);
      toast({ title: "Membro Removido", description: `${nome} foi removido da hierarquia.` });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao remover membro.", variant: "destructive" });
    }
  };

  const handleAddUsuario = async () => {
    if (!newUsuario.nome || !newUsuario.email || !newUsuario.senha) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    try {
      await createUserWithRole.mutateAsync({
        email: newUsuario.email,
        password: newUsuario.senha,
        nome: newUsuario.nome,
        role: newUsuario.role,
      });
      toast({ title: "Usuário Criado", description: `Conta criada para ${newUsuario.email}.` });
      setShowAddUsuario(false);
      setNewUsuario({ nome: "", email: "", senha: "", role: "moderador" });
    } catch (error: any) {
      toast({ 
        title: "Erro", 
        description: error.message || "Erro ao criar usuário.", 
        variant: "destructive" 
      });
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
      case "ativo":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-success/20 text-success">Ativo</span>;
      case "pausado":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-warning/20 text-warning">Pausado</span>;
      case "finalizado":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">Finalizado</span>;
      default:
        return null;
    }
  };

  const filteredAITs = aits.filter((ait) => {
    if (statusFilter !== "todos" && ait.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ait.nome_agente.toLowerCase().includes(term) ||
      ait.nome_condutor.toLowerCase().includes(term) ||
      ait.emplacamento.toLowerCase().includes(term) ||
      ait.numero_ait.toString().includes(term)
    );
  });

  const filteredPontos = pontos.filter((p: any) => {
    if (pontoStatusFilter === "todos") return true;
    return p.status === pontoStatusFilter;
  });

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "hierarquia", label: "Hierarquia", icon: Users },
    { id: "ait", label: "AITs", icon: FileText },
    { id: "ponto", label: "Ponto Eletrônico", icon: Clock },
    { id: "noticias", label: "Notícias", icon: Bell },
    { id: "cargos", label: "Cargos", icon: Briefcase },
    ...(userRole === "admin" ? [{ id: "usuarios", label: "Usuários", icon: Shield }] : []),
    { id: "config", label: "Configurações", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold">Visão Geral</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl p-6 shadow-neon border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats?.pendentes || 0}</p>
                    <p className="text-sm text-muted-foreground">AITs Pendentes</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-neon border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <Check className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalAITs || 0}</p>
                    <p className="text-sm text-muted-foreground">AITs Aprovados</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-neon border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <X className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats?.recusados || 0}</p>
                    <p className="text-sm text-muted-foreground">AITs Recusados</p>
                  </div>
                </div>
              </div>
              <div className="bg-card rounded-xl p-6 shadow-neon border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{hierarquia.length}</p>
                    <p className="text-sm text-muted-foreground">Membros Ativos</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-neon border border-primary/20 overflow-hidden">
              <div className="p-6 border-b border-border/50">
                <h3 className="font-display text-lg font-bold">AITs Recentes</h3>
              </div>
              {aitsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : aits.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum AIT registrado ainda.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {aits.slice(0, 5).map((ait) => (
                    <div key={ait.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">AIT #{ait.numero_ait}</p>
                          <p className="text-sm text-muted-foreground">{ait.nome_condutor} - {ait.emplacamento}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(ait.status)}
                        <span className="text-sm text-muted-foreground">
                          {new Date(ait.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AITStatisticsCharts />
          </div>
        );

      case "ponto":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="font-display text-2xl font-bold">Gerenciar Ponto Eletrônico</h2>
              <Select value={pontoStatusFilter} onValueChange={(v: any) => setPontoStatusFilter(v)}>
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

            {recusandoPontoId && (
              <div className="bg-card rounded-xl p-6 shadow-neon border border-destructive/30">
                <h3 className="font-bold mb-4">Recusar Ponto</h3>
                <Textarea
                  placeholder="Motivo da recusa..."
                  value={motivoRecusa}
                  onChange={(e) => setMotivoRecusa(e.target.value)}
                  className="mb-4"
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!motivoRecusa.trim()) {
                        toast({ title: "Erro", description: "Informe o motivo da recusa.", variant: "destructive" });
                        return;
                      }
                      await recusarPonto.mutateAsync({ id: recusandoPontoId, motivo: motivoRecusa });
                      toast({ title: "Ponto Recusado" });
                      setRecusandoPontoId(null);
                      setMotivoRecusa("");
                    }}
                    disabled={recusarPonto.isPending}
                  >
                    Confirmar Recusa
                  </Button>
                  <Button variant="outline" onClick={() => { setRecusandoPontoId(null); setMotivoRecusa(""); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl shadow-neon border border-primary/20 overflow-hidden">
              {pontosLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : filteredPontos.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum ponto encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">Usuário</th>
                        <th className="text-left p-4 font-semibold text-sm">Data</th>
                        <th className="text-left p-4 font-semibold text-sm">Função</th>
                        <th className="text-left p-4 font-semibold text-sm">Tempo</th>
                        <th className="text-left p-4 font-semibold text-sm">Status</th>
                        <th className="text-right p-4 font-semibold text-sm">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredPontos.map((ponto: any) => (
                        <tr key={ponto.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">{ponto.usuario?.nome || "Usuário"}</td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(ponto.data_inicio).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="p-4 capitalize">{ponto.funcao}</td>
                          <td className="p-4 font-mono">
                            {ponto.tempo_total_segundos ? formatDuration(ponto.tempo_total_segundos) : "-"}
                          </td>
                          <td className="p-4">{getStatusBadge(ponto.status)}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              {ponto.status === "pendente" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-success hover:text-success"
                                    onClick={async () => {
                                      await aprovarPonto.mutateAsync({ id: ponto.id, aprovadoPor: user!.id });
                                      toast({ title: "Ponto Aprovado" });
                                    }}
                                    disabled={aprovarPonto.isPending}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => setRecusandoPontoId(ponto.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {userRole === "admin" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={async () => {
                                    if (confirm("Deletar este ponto?")) {
                                      await deletePonto.mutateAsync(ponto.id);
                                      toast({ title: "Ponto Deletado" });
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case "noticias":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Gerenciar Notícias</h2>
              <Button onClick={() => { setShowAddNoticia(true); setNoticiaForm({ titulo: "", subtitulo: "", descricao: "", imagem_url: "", ativa: true }); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Notícia
              </Button>
            </div>

            {(showAddNoticia || editingNoticia) && (
              <div className="bg-card rounded-xl p-6 shadow-neon border border-primary/20">
                <h3 className="font-display text-lg font-bold mb-4">{editingNoticia ? "Editar" : "Nova"} Notícia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Título</Label>
                    <Input value={noticiaForm.titulo} onChange={(e) => setNoticiaForm({ ...noticiaForm, titulo: e.target.value })} placeholder="Título da notícia" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Subtítulo</Label>
                    <Input value={noticiaForm.subtitulo} onChange={(e) => setNoticiaForm({ ...noticiaForm, subtitulo: e.target.value })} placeholder="Subtítulo" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea value={noticiaForm.descricao} onChange={(e) => setNoticiaForm({ ...noticiaForm, descricao: e.target.value })} placeholder="Conteúdo" />
                  </div>
                  <div>
                    <Label>URL da Imagem</Label>
                    <Input value={noticiaForm.imagem_url} onChange={(e) => setNoticiaForm({ ...noticiaForm, imagem_url: e.target.value })} placeholder="https://..." />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={noticiaForm.ativa} onChange={(e) => setNoticiaForm({ ...noticiaForm, ativa: e.target.checked })} />
                    <Label>Ativa</Label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={async () => {
                      if (!noticiaForm.titulo) {
                        toast({ title: "Erro", description: "Título obrigatório.", variant: "destructive" });
                        return;
                      }
                      if (editingNoticia) {
                        await updateNoticia.mutateAsync({ id: editingNoticia.id, ...noticiaForm });
                        toast({ title: "Notícia Atualizada" });
                        setEditingNoticia(null);
                      } else {
                        await createNoticia.mutateAsync(noticiaForm);
                        toast({ title: "Notícia Criada" });
                        setShowAddNoticia(false);
                      }
                      setNoticiaForm({ titulo: "", subtitulo: "", descricao: "", imagem_url: "", ativa: true });
                    }}
                    disabled={createNoticia.isPending || updateNoticia.isPending}
                  >
                    {(createNoticia.isPending || updateNoticia.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAddNoticia(false); setEditingNoticia(null); }}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl shadow-neon border border-primary/20 overflow-hidden">
              {noticiasLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
              ) : noticias.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhuma notícia.</div>
              ) : (
                <div className="divide-y divide-border/50">
                  {noticias.map((n: any) => (
                    <div key={n.id} className="p-4 flex items-center justify-between hover:bg-muted/30">
                      <div>
                        <p className="font-medium">{n.titulo}</p>
                        <p className="text-sm text-muted-foreground">{n.subtitulo}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${n.ativa ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"}`}>
                          {n.ativa ? "Ativa" : "Inativa"}
                        </span>
                        <Button size="icon" variant="ghost" onClick={() => { setEditingNoticia(n); setNoticiaForm({ titulo: n.titulo, subtitulo: n.subtitulo || "", descricao: n.descricao || "", imagem_url: n.imagem_url || "", ativa: n.ativa }); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={async () => { if (confirm("Deletar?")) { await deleteNoticia.mutateAsync(n.id); toast({ title: "Notícia Deletada" }); } }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "cargos":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Gerenciar Cargos</h2>
              <Button onClick={() => { setShowAddCargo(true); setCargoForm({ nome: "", descricao: "", cor: "#FFD700", ordem: 0 }); }} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cargo
              </Button>
            </div>

            {(showAddCargo || editingCargo) && (
              <div className="bg-card rounded-xl p-6 shadow-neon border border-primary/20">
                <h3 className="font-display text-lg font-bold mb-4">{editingCargo ? "Editar" : "Novo"} Cargo</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input value={cargoForm.nome} onChange={(e) => setCargoForm({ ...cargoForm, nome: e.target.value })} placeholder="Nome do cargo" />
                  </div>
                  <div>
                    <Label>Cor</Label>
                    <Input type="color" value={cargoForm.cor} onChange={(e) => setCargoForm({ ...cargoForm, cor: e.target.value })} />
                  </div>
                  <div>
                    <Label>Ordem</Label>
                    <Input type="number" value={cargoForm.ordem} onChange={(e) => setCargoForm({ ...cargoForm, ordem: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="md:col-span-3">
                    <Label>Descrição</Label>
                    <Textarea value={cargoForm.descricao} onChange={(e) => setCargoForm({ ...cargoForm, descricao: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={async () => {
                      if (!cargoForm.nome) {
                        toast({ title: "Erro", description: "Nome obrigatório.", variant: "destructive" });
                        return;
                      }
                      if (editingCargo) {
                        await updateCargo.mutateAsync({ id: editingCargo.id, ...cargoForm });
                        toast({ title: "Cargo Atualizado" });
                        setEditingCargo(null);
                      } else {
                        await createCargo.mutateAsync(cargoForm);
                        toast({ title: "Cargo Criado" });
                        setShowAddCargo(false);
                      }
                    }}
                    disabled={createCargo.isPending || updateCargo.isPending}
                  >
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => { setShowAddCargo(false); setEditingCargo(null); }}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl shadow-neon border border-primary/20 overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <h3 className="font-semibold">Cargos</h3>
                </div>
                {cargosLoading ? (
                  <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {cargos.map((cargo: any) => (
                      <div
                        key={cargo.id}
                        className={`p-4 flex items-center justify-between hover:bg-muted/30 cursor-pointer ${selectedCargoForPerms === cargo.id ? "bg-primary/10" : ""}`}
                        onClick={() => setSelectedCargoForPerms(cargo.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cargo.cor }} />
                          <div>
                            <p className="font-medium">{cargo.nome}</p>
                            <p className="text-xs text-muted-foreground">{cargo.descricao}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setEditingCargo(cargo); setCargoForm({ nome: cargo.nome, descricao: cargo.descricao || "", cor: cargo.cor || "#FFD700", ordem: cargo.ordem || 0 }); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive" onClick={async (e) => { e.stopPropagation(); if (confirm("Deletar cargo?")) { await deleteCargo.mutateAsync(cargo.id); } }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-card rounded-xl shadow-neon border border-primary/20 overflow-hidden">
                <div className="p-4 border-b border-border/50">
                  <h3 className="font-semibold">Permissões do Cargo</h3>
                  {selectedCargoForPerms && (
                    <p className="text-sm text-muted-foreground">
                      {cargos.find((c: any) => c.id === selectedCargoForPerms)?.nome}
                    </p>
                  )}
                </div>
                {!selectedCargoForPerms ? (
                  <div className="p-8 text-center text-muted-foreground">Selecione um cargo</div>
                ) : (
                  <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
                    {permissoes.map((perm: any) => {
                      const hasThisPerm = cargoPermissoes.some((cp: any) => cp.cargo_id === selectedCargoForPerms && cp.permissao_id === perm.id);
                      return (
                        <div key={perm.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                          <div>
                            <p className="text-sm font-medium">{perm.nome}</p>
                            <p className="text-xs text-muted-foreground">{perm.codigo}</p>
                          </div>
                          <Button
                            size="sm"
                            variant={hasThisPerm ? "default" : "outline"}
                            onClick={async () => {
                              if (hasThisPerm) {
                                const cpToRemove = cargoPermissoes.find((cp: any) => cp.cargo_id === selectedCargoForPerms && cp.permissao_id === perm.id);
                                if (cpToRemove) await removeCargoPermissao.mutateAsync(cpToRemove.id);
                              } else {
                                await addCargoPermissao.mutateAsync({ cargo_id: selectedCargoForPerms, permissao_id: perm.id });
                              }
                            }}
                          >
                            {hasThisPerm ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "hierarquia":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Gerenciar Hierarquia</h2>
              <Button onClick={() => setShowAddHierarquia(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Membro
              </Button>
            </div>

            {showAddHierarquia && (
              <div className="bg-card rounded-xl p-6 shadow-neon border border-primary/20">
                <h3 className="font-display text-lg font-bold mb-4">Novo Membro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input value={newHierarquia.nome} onChange={(e) => setNewHierarquia({...newHierarquia, nome: e.target.value})} placeholder="Nome completo" />
                  </div>
                  <div>
                    <Label>RG</Label>
                    <Input value={newHierarquia.rg} onChange={(e) => setNewHierarquia({...newHierarquia, rg: e.target.value})} placeholder="Número do RG" />
                  </div>
                  <div>
                    <Label>Patente</Label>
                    <Select value={newHierarquia.patente} onValueChange={(v) => setNewHierarquia({...newHierarquia, patente: v})}>
                      <SelectTrigger><SelectValue placeholder="Selecione a patente" /></SelectTrigger>
                      <SelectContent>
                        {patentes.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Função</Label>
                    <Input value={newHierarquia.funcao} onChange={(e) => setNewHierarquia({...newHierarquia, funcao: e.target.value})} placeholder="Função" />
                  </div>
                  <div>
                    <Label>Data de Entrada</Label>
                    <Input type="date" value={newHierarquia.dataEntrada} onChange={(e) => setNewHierarquia({...newHierarquia, dataEntrada: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Observação</Label>
                    <Textarea value={newHierarquia.observacao} onChange={(e) => setNewHierarquia({...newHierarquia, observacao: e.target.value})} placeholder="Observações" />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddHierarquia} disabled={createHierarquia.isPending}>
                    {createHierarquia.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Adicionar
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddHierarquia(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            {editingHierarquia && (
              <div className="bg-card rounded-xl p-6 shadow-neon border border-primary/20">
                <h3 className="font-display text-lg font-bold mb-4">Editar Membro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input value={editingHierarquia.nome} onChange={(e) => setEditingHierarquia({...editingHierarquia, nome: e.target.value})} />
                  </div>
                  <div>
                    <Label>RG</Label>
                    <Input value={editingHierarquia.rg} onChange={(e) => setEditingHierarquia({...editingHierarquia, rg: e.target.value})} />
                  </div>
                  <div>
                    <Label>Patente</Label>
                    <Select value={editingHierarquia.patente} onValueChange={(v) => setEditingHierarquia({...editingHierarquia, patente: v as typeof editingHierarquia.patente})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {patentes.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Função</Label>
                    <Input value={editingHierarquia.funcao} onChange={(e) => setEditingHierarquia({...editingHierarquia, funcao: e.target.value})} />
                  </div>
                  <div>
                    <Label>Data de Entrada</Label>
                    <Input type="date" value={editingHierarquia.data_entrada} onChange={(e) => setEditingHierarquia({...editingHierarquia, data_entrada: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Observação</Label>
                    <Textarea value={editingHierarquia.observacao || ""} onChange={(e) => setEditingHierarquia({...editingHierarquia, observacao: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleUpdateHierarquia} disabled={updateHierarquia.isPending}>
                    {updateHierarquia.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setEditingHierarquia(null)}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl shadow-neon border border-primary/20 overflow-hidden">
              {hierarquiaLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
              ) : hierarquia.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhum membro cadastrado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">Nome</th>
                        <th className="text-left p-4 font-semibold text-sm">RG</th>
                        <th className="text-left p-4 font-semibold text-sm">Patente</th>
                        <th className="text-left p-4 font-semibold text-sm">Função</th>
                        <th className="text-left p-4 font-semibold text-sm">Entrada</th>
                        <th className="text-right p-4 font-semibold text-sm">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {hierarquia.map((m) => (
                        <tr key={m.id} className="hover:bg-muted/30">
                          <td className="p-4 font-medium">{m.nome}</td>
                          <td className="p-4 text-muted-foreground">{m.rg}</td>
                          <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary">{m.patente}</span></td>
                          <td className="p-4 text-muted-foreground">{m.funcao}</td>
                          <td className="p-4 text-muted-foreground">{new Date(m.data_entrada).toLocaleDateString('pt-BR')}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="icon" variant="ghost" onClick={() => setEditingHierarquia(m)}><Edit className="h-4 w-4" /></Button>
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteHierarquia(m.id, m.nome)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case "ait":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="font-display text-2xl font-bold">Gerenciar AITs</h2>
              <div className="flex gap-2 items-center flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar..." className="pl-9 w-48" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="aprovado">Aprovados</SelectItem>
                    <SelectItem value="recusado">Recusados</SelectItem>
                  </SelectContent>
                </Select>
                {userRole === "admin" && (
                  <Button variant="destructive" onClick={async () => { if (confirm("Deletar TODOS os AITs?")) { await deleteAllAITs.mutateAsync(); toast({ title: "AITs Deletados" }); } }} disabled={deleteAllAITs.isPending} className="gap-2">
                    {deleteAllAITs.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Trash2 className="h-4 w-4" />
                    Deletar AITs
                  </Button>
                )}
                <Button variant="outline" onClick={() => exportAllAITsToPDF(filteredAITs)} className="gap-2" disabled={filteredAITs.length === 0}>
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </div>

            {selectedAIT && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-primary/20 shadow-neon">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display text-2xl font-bold">AIT #{selectedAIT.numero_ait}</h3>
                      <p className="text-sm text-muted-foreground">{new Date(selectedAIT.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(selectedAIT.status)}
                      <Button size="icon" variant="outline" onClick={() => exportAITToPDF(selectedAIT)}><Download className="h-5 w-5" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setSelectedAIT(null)}><X className="h-5 w-5" /></Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-xs text-muted-foreground">Agente</p><p className="font-semibold">{selectedAIT.graduacao} {selectedAIT.nome_agente}</p></div>
                      <div><p className="text-xs text-muted-foreground">Viatura</p><p className="font-semibold">{selectedAIT.viatura}</p></div>
                      <div><p className="text-xs text-muted-foreground">Condutor</p><p className="font-semibold">{selectedAIT.nome_condutor}</p></div>
                      <div><p className="text-xs text-muted-foreground">Passaporte</p><p className="font-semibold font-mono">{selectedAIT.passaporte_condutor}</p></div>
                      <div><p className="text-xs text-muted-foreground">Veículo</p><p className="font-semibold">{selectedAIT.marca_modelo}</p></div>
                      <div><p className="text-xs text-muted-foreground">Placa</p><p className="font-semibold">{selectedAIT.emplacamento}</p></div>
                    </div>
                    <div><p className="text-xs text-muted-foreground">Relatório</p><p className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap">{selectedAIT.relatorio}</p></div>
                    {selectedAIT.artigos_infringidos.length > 0 && (
                      <div><p className="text-xs text-muted-foreground mb-2">Artigos</p><div className="flex flex-wrap gap-2">{selectedAIT.artigos_infringidos.map((a, i) => (<span key={i} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">{a}</span>))}</div></div>
                    )}
                    {selectedAIT.status === "pendente" && (
                      <div className="flex gap-2 pt-4 border-t border-border/50">
                        <Button onClick={() => { handleApproveAIT(selectedAIT.id); setSelectedAIT(null); }} className="gap-2"><Check className="h-4 w-4" />Aprovar</Button>
                        <Button variant="destructive" onClick={() => { handleRejectAIT(selectedAIT.id); setSelectedAIT(null); }} className="gap-2"><X className="h-4 w-4" />Recusar</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl shadow-neon border border-primary/20 overflow-hidden">
              {aitsLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
              ) : filteredAITs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhum AIT encontrado.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">#</th>
                        <th className="text-left p-4 font-semibold text-sm">Agente</th>
                        <th className="text-left p-4 font-semibold text-sm">Condutor</th>
                        <th className="text-left p-4 font-semibold text-sm">Placa</th>
                        <th className="text-left p-4 font-semibold text-sm">Data</th>
                        <th className="text-left p-4 font-semibold text-sm">Status</th>
                        <th className="text-right p-4 font-semibold text-sm">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredAITs.map((ait) => (
                        <tr key={ait.id} className="hover:bg-muted/30">
                          <td className="p-4 font-mono font-bold text-primary">{ait.numero_ait}</td>
                          <td className="p-4">{ait.nome_agente}</td>
                          <td className="p-4">{ait.nome_condutor}</td>
                          <td className="p-4 font-mono">{ait.emplacamento}</td>
                          <td className="p-4 text-muted-foreground">{new Date(ait.created_at).toLocaleDateString('pt-BR')}</td>
                          <td className="p-4">{getStatusBadge(ait.status)}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="icon" variant="ghost" onClick={() => setSelectedAIT(ait)}><Eye className="h-4 w-4" /></Button>
                              {ait.status === "pendente" && (
                                <>
                                  <Button size="icon" variant="ghost" className="text-success" onClick={() => handleApproveAIT(ait.id)}><Check className="h-4 w-4" /></Button>
                                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleRejectAIT(ait.id)}><X className="h-4 w-4" /></Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case "usuarios":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Gerenciar Usuários</h2>
              <Button onClick={() => setShowAddUsuario(true)} className="gap-2"><UserPlus className="h-4 w-4" />Novo Usuário</Button>
            </div>

            {showAddUsuario && (
              <div className="bg-card rounded-xl p-6 shadow-neon border border-primary/20">
                <h3 className="font-display text-lg font-bold mb-4">Criar Novo Usuário</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Nome</Label><Input value={newUsuario.nome} onChange={(e) => setNewUsuario({...newUsuario, nome: e.target.value})} placeholder="Nome" /></div>
                  <div><Label>E-mail</Label><Input type="email" value={newUsuario.email} onChange={(e) => setNewUsuario({...newUsuario, email: e.target.value})} placeholder="email@exemplo.com" /></div>
                  <div><Label>Senha</Label><Input type="password" value={newUsuario.senha} onChange={(e) => setNewUsuario({...newUsuario, senha: e.target.value})} placeholder="••••••••" /></div>
                  <div><Label>Cargo</Label><Select value={newUsuario.role} onValueChange={(v) => setNewUsuario({...newUsuario, role: v as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="moderador">Moderador</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent></Select></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddUsuario} disabled={createUserWithRole.isPending}>{createUserWithRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Criar</Button>
                  <Button variant="outline" onClick={() => setShowAddUsuario(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            {showChangePassword && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-2xl p-6 max-w-md w-full border border-primary/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-xl font-bold">Alterar Senha</h3>
                    <Button size="icon" variant="ghost" onClick={() => { setShowChangePassword(null); setNewPassword(""); }}><X className="h-5 w-5" /></Button>
                  </div>
                  <div><Label>Nova Senha</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" className="mb-4" /></div>
                  <div className="flex gap-2">
                    <Button onClick={async () => { if (newPassword.length < 6) { toast({ title: "Erro", description: "Senha mínima 6 caracteres.", variant: "destructive" }); return; } await updateUserPassword.mutateAsync({ userId: showChangePassword, newPassword }); toast({ title: "Senha Alterada" }); setShowChangePassword(null); setNewPassword(""); }} disabled={updateUserPassword.isPending}>{updateUserPassword.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Alterar</Button>
                    <Button variant="outline" onClick={() => { setShowChangePassword(null); setNewPassword(""); }}>Cancelar</Button>
                  </div>
                </div>
              </div>
            )}

            {showEditUser && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-2xl p-6 max-w-md w-full border border-primary/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-xl font-bold">Editar Usuário</h3>
                    <Button size="icon" variant="ghost" onClick={() => setShowEditUser(null)}><X className="h-5 w-5" /></Button>
                  </div>
                  <div className="space-y-4">
                    <div><Label>Nome</Label><Input value={editUserData.nome} onChange={(e) => setEditUserData({ ...editUserData, nome: e.target.value })} /></div>
                    <div><Label>E-mail</Label><Input type="email" value={editUserData.email} onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })} /></div>
                    <div className="flex gap-2">
                      <Button onClick={async () => { await updateUser.mutateAsync({ userId: showEditUser.user_id, nome: editUserData.nome, email: editUserData.email }); toast({ title: "Usuário Atualizado" }); setShowEditUser(null); }} disabled={updateUser.isPending}>{updateUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar</Button>
                      <Button variant="outline" onClick={() => setShowEditUser(null)}>Cancelar</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl shadow-neon border border-primary/20 overflow-hidden">
              {usersLoading ? (
                <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" /></div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhum usuário.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">Nome</th>
                        <th className="text-left p-4 font-semibold text-sm">E-mail</th>
                        <th className="text-left p-4 font-semibold text-sm">Cargos</th>
                        <th className="text-left p-4 font-semibold text-sm">Data</th>
                        <th className="text-right p-4 font-semibold text-sm">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/30">
                          <td className="p-4 font-medium">{u.nome}</td>
                          <td className="p-4">{u.email}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.length === 0 ? (<span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">Usuário</span>) : u.roles.map((role) => (
                                <span key={role} className={`px-2 py-1 rounded-full text-xs font-semibold ${role === "admin" ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>{role === "admin" ? "Admin" : "Mod"}</span>
                              ))}
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</td>
                          <td className="p-4 text-right">
                            {u.user_id !== user?.id && (
                              <div className="flex gap-2 justify-end flex-wrap items-center">
                                <Select value={u.roles.includes("admin") ? "admin" : u.roles.includes("moderador") ? "moderador" : "none"} onValueChange={async (value) => { if (u.roles.includes("admin")) await removeRole.mutateAsync({ userId: u.user_id, role: "admin" }); if (u.roles.includes("moderador")) await removeRole.mutateAsync({ userId: u.user_id, role: "moderador" }); if (value !== "none") await assignRole.mutateAsync({ userId: u.user_id, role: value as any }); }} disabled={assignRole.isPending || removeRole.isPending}>
                                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                                  <SelectContent><SelectItem value="none">Usuário</SelectItem><SelectItem value="moderador">Mod</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
                                </Select>
                                <Button size="sm" variant="outline" onClick={() => { setShowEditUser(u); setEditUserData({ nome: u.nome, email: u.email }); }}><Edit className="h-4 w-4" /></Button>
                                <Button size="sm" variant="outline" onClick={() => setShowChangePassword(u.user_id)}><Key className="h-4 w-4" /></Button>
                                <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => { if (confirm(`Deletar ${u.nome}?`)) { await deleteUser.mutateAsync(u.user_id); toast({ title: "Usuário Deletado" }); } }} disabled={deleteUser.isPending}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case "config":
        return <SettingsContent />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-primary/20 flex flex-col shadow-neon">
        {/* Logo */}
        <div className="p-6 border-b border-primary/20">
          <div className="flex items-center gap-3">
            <img src={logoCptran} alt="Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="font-display text-lg font-bold text-primary neon-text">CPTran</h1>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-primary text-primary-foreground shadow-neon"
                    : "text-foreground hover:bg-primary/10 hover:text-primary"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="font-bold text-primary-foreground">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                {user?.email || "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {rolesLoading ? "Carregando..." : userRole || "Usuário"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1 justify-start gap-2 text-foreground hover:bg-primary/10" onClick={() => navigate("/")}>
              <Home className="h-5 w-5" />Início
            </Button>
            <Button variant="ghost" className="flex-1 justify-start gap-2 text-foreground hover:bg-primary/10" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {authLoading || rolesLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !userRole ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Acesso Negado</h2>
                <p className="text-muted-foreground">Você não tem permissão para acessar este painel.</p>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
