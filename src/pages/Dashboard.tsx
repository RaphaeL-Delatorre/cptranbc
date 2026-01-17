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
  Camera,
  Download,
  User,
  Printer,
} from "lucide-react";
import logoTransito from "@/assets/logo-transito.png";
import { useAITs, useAITStats, useUpdateAITStatus, useDeleteAllAITs, useDeleteAIT, type AIT } from "@/hooks/useAITs";
import { useHierarquia, useCreateHierarquia, useUpdateHierarquia, useDeleteHierarquia, type HierarquiaMembro } from "@/hooks/useHierarquia";
import { patentes } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useRoles";
import { useUsers, useCreateUserWithRole, useAssignRole, useRemoveRole, useDeleteUser, useUpdateUserPassword, useUpdateUser, type UserWithRole } from "@/hooks/useUsers";
import { SettingsContent } from "@/components/dashboard/SettingsContent";
import { AITStatisticsCharts } from "@/components/dashboard/AITStatisticsCharts";
import { MyProfileContent } from "@/components/dashboard/MyProfileContent";
import { PontoEletronicoContent } from "@/components/dashboard/PontoEletronicoContent";
import { AITContent } from "@/components/dashboard/AITContent";
import { exportAITToPDF, exportAllAITsToPDF } from "@/utils/pdfExport";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";

type TabType = "dashboard" | "perfil" | "hierarquia" | "ait" | "ait-estatisticas" | "ponto" | "usuarios" | "config";

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

  // Determine user role
  const userRole = userRoles.find(r => r.role === "admin") ? "admin" : 
                   userRoles.find(r => r.role === "moderador") ? "moderador" : null;

  // Database hooks
  const { data: aits = [], isLoading: aitsLoading } = useAITs();
  const { data: stats } = useAITStats();
  const { data: hierarquia = [], isLoading: hierarquiaLoading } = useHierarquia();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const updateAITStatus = useUpdateAITStatus();
  const deleteAllAITs = useDeleteAllAITs();
  const deleteAIT = useDeleteAIT();
  const createHierarquia = useCreateHierarquia();
  const updateHierarquia = useUpdateHierarquia();
  const deleteHierarquia = useDeleteHierarquia();
  const createUserWithRole = useCreateUserWithRole();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const deleteUser = useDeleteUser();
  const updateUserPassword = useUpdateUserPassword();
  const updateUser = useUpdateUser();

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
        // User is authenticated but doesn't have admin or moderador role
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
      default:
        return null;
    }
  };

  const filteredAITs = aits.filter((ait) => {
    // Status filter
    if (statusFilter !== "todos" && ait.status !== statusFilter) return false;
    
    // Search filter
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ait.nome_agente.toLowerCase().includes(term) ||
      ait.nome_condutor.toLowerCase().includes(term) ||
      ait.emplacamento.toLowerCase().includes(term) ||
      ait.numero_ait.toString().includes(term)
    );
  });

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-bold">Visão Geral</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
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
              <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
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
              <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
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
              <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{hierarquia.length}</p>
                    <p className="text-sm text-muted-foreground">Membros Ativos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent AITs */}
            <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
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

          </div>
        );

      case "perfil":
        return <MyProfileContent />;

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

            {/* Add Modal */}
            {showAddHierarquia && (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
                <h3 className="font-display text-lg font-bold mb-4">Novo Membro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={newHierarquia.nome}
                      onChange={(e) => setNewHierarquia({...newHierarquia, nome: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label>RG</Label>
                    <Input
                      value={newHierarquia.rg}
                      onChange={(e) => setNewHierarquia({...newHierarquia, rg: e.target.value})}
                      placeholder="Número do RG"
                    />
                  </div>
                  <div>
                    <Label>Patente</Label>
                    <Select value={newHierarquia.patente} onValueChange={(v) => setNewHierarquia({...newHierarquia, patente: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a patente" />
                      </SelectTrigger>
                      <SelectContent>
                        {patentes.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Função</Label>
                    <Input
                      value={newHierarquia.funcao}
                      onChange={(e) => setNewHierarquia({...newHierarquia, funcao: e.target.value})}
                      placeholder="Função"
                    />
                  </div>
                  <div>
                    <Label>Data de Entrada</Label>
                    <Input
                      type="date"
                      value={newHierarquia.dataEntrada}
                      onChange={(e) => setNewHierarquia({...newHierarquia, dataEntrada: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Observação</Label>
                    <Textarea
                      value={newHierarquia.observacao}
                      onChange={(e) => setNewHierarquia({...newHierarquia, observacao: e.target.value})}
                      placeholder="Observações adicionais"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddHierarquia} disabled={createHierarquia.isPending}>
                    {createHierarquia.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Adicionar
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddHierarquia(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Edit Modal */}
            {editingHierarquia && (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
                <h3 className="font-display text-lg font-bold mb-4">Editar Membro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={editingHierarquia.nome}
                      onChange={(e) => setEditingHierarquia({...editingHierarquia, nome: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>RG</Label>
                    <Input
                      value={editingHierarquia.rg}
                      onChange={(e) => setEditingHierarquia({...editingHierarquia, rg: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Patente</Label>
                    <Select value={editingHierarquia.patente} onValueChange={(v) => setEditingHierarquia({...editingHierarquia, patente: v as typeof editingHierarquia.patente})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {patentes.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Função</Label>
                    <Input
                      value={editingHierarquia.funcao}
                      onChange={(e) => setEditingHierarquia({...editingHierarquia, funcao: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Data de Entrada</Label>
                    <Input
                      type="date"
                      value={editingHierarquia.data_entrada}
                      onChange={(e) => setEditingHierarquia({...editingHierarquia, data_entrada: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Observação</Label>
                    <Textarea
                      value={editingHierarquia.observacao || ""}
                      onChange={(e) => setEditingHierarquia({...editingHierarquia, observacao: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleUpdateHierarquia} disabled={updateHierarquia.isPending}>
                    {updateHierarquia.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Salvar Alterações
                  </Button>
                  <Button variant="outline" onClick={() => setEditingHierarquia(null)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
              {hierarquiaLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : hierarquia.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum membro cadastrado ainda.
                </div>
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
                      {hierarquia.map((membro) => (
                        <tr key={membro.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">{membro.nome}</td>
                          <td className="p-4 text-muted-foreground">{membro.rg}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                              {membro.patente}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">{membro.funcao}</td>
                          <td className="p-4 text-muted-foreground">{new Date(membro.data_entrada).toLocaleDateString('pt-BR')}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="icon" variant="ghost" onClick={() => setEditingHierarquia(membro)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteHierarquia(membro.id, membro.nome)}
                              >
                                <Trash2 className="h-4 w-4" />
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
          </div>
        );

      case "ait-estatisticas":
        return <AITStatisticsCharts />;

      case "ponto":
        return <PontoEletronicoContent />;

      case "ait":
        return <AITContent />;

      case "usuarios":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Gerenciar Usuários</h2>
              <Button onClick={() => setShowAddUsuario(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Novo Usuário
              </Button>
            </div>

            {/* Add User Modal */}
            {showAddUsuario && (
              <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
                <h3 className="font-display text-lg font-bold mb-4">Criar Novo Usuário</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome</Label>
                    <Input
                      value={newUsuario.nome}
                      onChange={(e) => setNewUsuario({...newUsuario, nome: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={newUsuario.email}
                      onChange={(e) => setNewUsuario({...newUsuario, email: e.target.value})}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      value={newUsuario.senha}
                      onChange={(e) => setNewUsuario({...newUsuario, senha: e.target.value})}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <Label>Cargo</Label>
                    <Select value={newUsuario.role} onValueChange={(v) => setNewUsuario({...newUsuario, role: v as "admin" | "moderador"})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="moderador">Moderador</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddUsuario} disabled={createUserWithRole.isPending}>
                    {createUserWithRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Criar Usuário
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddUsuario(false)}>Cancelar</Button>
                </div>
              </div>
            )}

            {/* Change Password Modal */}
            {showChangePassword && (
              <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-2xl p-6 max-w-md w-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-xl font-bold">Alterar Senha</h3>
                    <Button size="icon" variant="ghost" onClick={() => { setShowChangePassword(null); setNewPassword(""); }}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Nova Senha</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          if (newPassword.length < 6) {
                            toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
                            return;
                          }
                          try {
                            await updateUserPassword.mutateAsync({ userId: showChangePassword, newPassword });
                            toast({ title: "Senha Alterada", description: "A senha foi alterada com sucesso." });
                            setShowChangePassword(null);
                            setNewPassword("");
                          } catch (error: any) {
                            toast({ title: "Erro", description: error.message || "Erro ao alterar senha.", variant: "destructive" });
                          }
                        }}
                        disabled={updateUserPassword.isPending}
                      >
                        {updateUserPassword.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Alterar Senha
                      </Button>
                      <Button variant="outline" onClick={() => { setShowChangePassword(null); setNewPassword(""); }}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit User Modal */}
            {showEditUser && (
              <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-2xl p-6 max-w-md w-full">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-xl font-bold">Editar Usuário</h3>
                    <Button size="icon" variant="ghost" onClick={() => setShowEditUser(null)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Nome</Label>
                      <Input
                        value={editUserData.nome}
                        onChange={(e) => setEditUserData({ ...editUserData, nome: e.target.value })}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label>E-mail</Label>
                      <Input
                        type="email"
                        value={editUserData.email}
                        onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={async () => {
                          try {
                            await updateUser.mutateAsync({ 
                              userId: showEditUser.user_id, 
                              nome: editUserData.nome, 
                              email: editUserData.email 
                            });
                            toast({ title: "Usuário Atualizado", description: "Os dados foram atualizados com sucesso." });
                            setShowEditUser(null);
                          } catch (error: any) {
                            toast({ title: "Erro", description: error.message || "Erro ao atualizar usuário.", variant: "destructive" });
                          }
                        }}
                        disabled={updateUser.isPending}
                      >
                        {updateUser.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={() => setShowEditUser(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users List */}
            <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
              {usersLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum usuário cadastrado ainda.
                </div>
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
                        <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">{u.nome}</td>
                          <td className="p-4">{u.email}</td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {u.roles.length === 0 ? (
                                <span className="px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                                  Usuário
                                </span>
                              ) : (
                                u.roles.map((role) => (
                                  <span
                                    key={role}
                                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                      role === "admin"
                                        ? "bg-destructive/20 text-destructive"
                                        : "bg-primary/20 text-primary"
                                    }`}
                                  >
                                    {role === "admin" ? "Admin" : "Moderador"}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString("pt-BR")}
                          </td>
                          <td className="p-4 text-right">
                            {u.user_id !== user?.id && (
                              <div className="flex gap-2 justify-end flex-wrap items-center">
                                <Select
                                  value={u.roles.includes("admin") ? "admin" : u.roles.includes("moderador") ? "moderador" : "none"}
                                  onValueChange={async (value) => {
                                    // Remove current roles first
                                    if (u.roles.includes("admin")) {
                                      await removeRole.mutateAsync({ userId: u.user_id, role: "admin" });
                                    }
                                    if (u.roles.includes("moderador")) {
                                      await removeRole.mutateAsync({ userId: u.user_id, role: "moderador" });
                                    }
                                    // Assign new role if not "none"
                                    if (value !== "none") {
                                      await assignRole.mutateAsync({ userId: u.user_id, role: value as "admin" | "moderador" });
                                    }
                                  }}
                                  disabled={assignRole.isPending || removeRole.isPending}
                                >
                                  <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Cargo" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">Usuário</SelectItem>
                                    <SelectItem value="moderador">Moderador</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setShowEditUser(u);
                                    setEditUserData({ nome: u.nome, email: u.email });
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setShowChangePassword(u.user_id)}
                                >
                                  <Key className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive"
                                  onClick={async () => {
                                    if (confirm(`Tem certeza que deseja deletar o usuário ${u.nome}?`)) {
                                      try {
                                        await deleteUser.mutateAsync(u.user_id);
                                        toast({ title: "Usuário Deletado", description: `${u.nome} foi removido do sistema.` });
                                      } catch (error: any) {
                                        toast({ title: "Erro", description: error.message || "Erro ao deletar usuário.", variant: "destructive" });
                                      }
                                    }
                                  }}
                                  disabled={deleteUser.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <img src={logoTransito} alt="Logo" className="h-10 w-10 object-contain" />
            <div>
              <h1 className="font-display text-lg font-bold text-sidebar-foreground">CPTran</h1>
              <p className="text-xs text-sidebar-foreground/60">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-4">
          {/* Geral */}
          <div>
            <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-4">Geral</p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "dashboard"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("perfil")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "perfil"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <User className="h-5 w-5" />
                Meu Perfil
              </button>
            </div>
          </div>

          {/* Administrativo */}
          <div>
            <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-4">Administrativo</p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab("hierarquia")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "hierarquia"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Users className="h-5 w-5" />
                Hierarquia
              </button>
              <button
                onClick={() => setActiveTab("ait")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "ait"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <FileText className="h-5 w-5" />
                AITs
              </button>
              <button
                onClick={() => setActiveTab("ait-estatisticas")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all pl-8 ${
                  activeTab === "ait-estatisticas"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <FileText className="h-4 w-4" />
                Estatísticas
              </button>
              <button
                onClick={() => setActiveTab("ponto")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "ponto"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Clock className="h-5 w-5" />
                Ponto Eletrônico
              </button>
            </div>
          </div>

          {/* Sistema */}
          {(userRole === "admin" || userRole === "moderador") && (
            <div>
              <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-4">Sistema</p>
              <div className="space-y-1">
                {userRole === "admin" && (
                  <button
                    onClick={() => setActiveTab("usuarios")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeTab === "usuarios"
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    Usuários
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("config")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === "config"
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  Configurações
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* User & Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
              <span className="font-bold text-sidebar-primary-foreground">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground truncate max-w-[150px]">
                {user?.email || "Usuário"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">
                {rolesLoading ? "Carregando..." : userRole || "Usuário"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={() => navigate("/")}
            >
              <Home className="h-5 w-5" />
              Início
            </Button>
            <Button
              variant="ghost"
              className="flex-1 justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {authLoading || rolesLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
