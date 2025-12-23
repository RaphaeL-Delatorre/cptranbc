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
} from "lucide-react";
import logoTransito from "@/assets/logo-transito.png";
import { useAITs, useAITStats, useUpdateAITStatus, useDeleteAllAITs, type AIT } from "@/hooks/useAITs";
import { useHierarquia, useCreateHierarquia, useUpdateHierarquia, useDeleteHierarquia, type HierarquiaMembro } from "@/hooks/useHierarquia";
import { patentes } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useRoles";
import { useUsers, useCreateUserWithRole, useAssignRole, useRemoveRole, useDeleteUser, useUpdateUserPassword, useUpdateUser, type UserWithRole } from "@/hooks/useUsers";
import { SettingsContent } from "@/components/dashboard/SettingsContent";
import { AITStatisticsCharts } from "@/components/dashboard/AITStatisticsCharts";
import { exportAITToPDF, exportAllAITsToPDF } from "@/utils/pdfExport";
import { supabase } from "@/integrations/supabase/client";

type TabType = "dashboard" | "hierarquia" | "ait" | "usuarios" | "config";

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

            {/* Statistics Charts */}
            <AITStatisticsCharts />
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

      case "ait":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="font-display text-2xl font-bold">Gerenciar AITs</h2>
              <div className="flex gap-2 items-center flex-wrap">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar AIT..." 
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
                {userRole === "admin" && (
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (confirm("Tem certeza que deseja DELETAR TODOS os AITs? Esta ação não pode ser desfeita e os IDs serão reiniciados.")) {
                        try {
                          await deleteAllAITs.mutateAsync();
                          toast({ title: "AITs Deletados", description: "Todos os AITs foram removidos do sistema." });
                        } catch (error: any) {
                          toast({ title: "Erro", description: error.message || "Erro ao deletar AITs.", variant: "destructive" });
                        }
                      }
                    }}
                    disabled={deleteAllAITs.isPending}
                    className="gap-2"
                  >
                    {deleteAllAITs.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Trash2 className="h-4 w-4" />
                    Deletar AITs
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => exportAllAITsToPDF(filteredAITs)}
                  className="gap-2"
                  disabled={filteredAITs.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </div>

            {/* AIT Detail Modal */}
            {selectedAIT && (
              <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display text-2xl font-bold">AIT #{selectedAIT.numero_ait}</h3>
                      <p className="text-sm text-muted-foreground">
                        Criado em {new Date(selectedAIT.created_at).toLocaleDateString('pt-BR')} às {new Date(selectedAIT.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                    {/* Seção 1: Policial Responsável pelo AIT */}
                    <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                      <h4 className="font-semibold text-primary text-lg flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-sm">1</span>
                        Policial Responsável pelo AIT
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Graduação</p>
                          <p className="text-base font-semibold">{selectedAIT.graduacao}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Nome do Policial</p>
                          <p className="text-base font-semibold">{selectedAIT.nome_agente}</p>
                        </div>
                      </div>
                    </div>

                    {/* Seção 2: Equipe e Viatura */}
                    <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                      <h4 className="font-semibold text-primary text-lg flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-sm">2</span>
                        Equipe e Viatura
                      </h4>
                      
                      {/* Viatura */}
                      <div className="pb-4 border-b border-border/50">
                        <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Viatura</p>
                        <p className="text-lg font-semibold">{selectedAIT.viatura}</p>
                      </div>
                      
                      {/* Encarregados */}
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground uppercase tracking-wide">Encarregados</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-background/50 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">1º Homem (Motorista)</p>
                            <p className="text-base font-medium">{selectedAIT.primeiro_homem_patente ? `${selectedAIT.primeiro_homem_patente} ` : ''}{selectedAIT.primeiro_homem}</p>
                          </div>
                          {selectedAIT.segundo_homem && (
                            <div className="p-3 bg-background/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">2º Homem (Encarregado)</p>
                              <p className="text-base font-medium">{selectedAIT.segundo_homem_patente ? `${selectedAIT.segundo_homem_patente} ` : ''}{selectedAIT.segundo_homem}</p>
                            </div>
                          )}
                          {selectedAIT.terceiro_homem && (
                            <div className="p-3 bg-background/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">3º Homem</p>
                              <p className="text-base font-medium">{selectedAIT.terceiro_homem_patente ? `${selectedAIT.terceiro_homem_patente} ` : ''}{selectedAIT.terceiro_homem}</p>
                            </div>
                          )}
                          {selectedAIT.quarto_homem && (
                            <div className="p-3 bg-background/50 rounded-lg">
                              <p className="text-xs text-muted-foreground mb-1">4º Homem</p>
                              <p className="text-base font-medium">{selectedAIT.quarto_homem_patente ? `${selectedAIT.quarto_homem_patente} ` : ''}{selectedAIT.quarto_homem}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Seção 3: Data/Hora e Relatório */}
                    <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                      <h4 className="font-semibold text-primary text-lg flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-sm">3</span>
                        Data/Hora e Relatório
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedAIT.data_inicio && (
                          <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Data/Hora de Início</p>
                            <p className="text-base font-semibold">
                              {new Date(selectedAIT.data_inicio).toLocaleDateString('pt-BR')} às {new Date(selectedAIT.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                        {selectedAIT.data_termino && (
                          <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Data/Hora de Término</p>
                            <p className="text-base font-semibold">
                              {new Date(selectedAIT.data_termino).toLocaleDateString('pt-BR')} às {new Date(selectedAIT.data_termino).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Relatório</p>
                        <p className="text-base bg-background p-4 rounded-lg border border-border/50 whitespace-pre-wrap">{selectedAIT.relatorio}</p>
                      </div>
                    </div>

                    {/* Seção 4: Dados do Motorista/Proprietário/Veículo */}
                    <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                      <h4 className="font-semibold text-primary text-lg flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-sm">4</span>
                        Motorista, Proprietário e Veículo
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Nome do Motorista</p>
                          <p className="text-base font-semibold">{selectedAIT.nome_condutor}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Passaporte do Motorista</p>
                          <p className="text-base font-semibold font-mono">{selectedAIT.passaporte_condutor}</p>
                        </div>
                        {selectedAIT.nome_proprietario && (
                          <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Nome do Proprietário</p>
                            <p className="text-base font-semibold">{selectedAIT.nome_proprietario}</p>
                          </div>
                        )}
                        {selectedAIT.passaporte_proprietario && (
                          <div>
                            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Passaporte do Proprietário</p>
                            <p className="text-base font-semibold font-mono">{selectedAIT.passaporte_proprietario}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Marca/Modelo</p>
                          <p className="text-base font-semibold">{selectedAIT.marca_modelo}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Emplacamento</p>
                          <p className="text-lg font-bold font-mono">{selectedAIT.emplacamento}</p>
                        </div>
                      </div>
                    </div>

                    {/* Seção 5: Artigos e Providências */}
                    <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                      <h4 className="font-semibold text-primary text-lg flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-sm">5</span>
                        Artigos Infringidos e Providências
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Artigos Infringidos</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedAIT.artigos_infringidos?.length > 0 ? (
                              selectedAIT.artigos_infringidos.map((art) => (
                                <span key={art} className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-base font-semibold">
                                  {art}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground">Nenhum artigo informado</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Providências Tomadas</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedAIT.providencias_tomadas?.length > 0 ? (
                              selectedAIT.providencias_tomadas.map((prov) => (
                                <span key={prov} className="px-4 py-2 bg-secondary/10 text-secondary rounded-lg text-base font-semibold">
                                  {prov}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground">Nenhuma providência informada</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seção 6: Imagens */}
                    <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                      <h4 className="font-semibold text-primary text-lg flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-sm">6</span>
                        <Camera className="h-5 w-5" />
                        Imagens da Autuação
                      </h4>
                      {selectedAIT.imagens && selectedAIT.imagens.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {selectedAIT.imagens.map((imgPath, idx) => {
                            // Get the public URL for the image
                            const imageUrl = imgPath.startsWith('http') 
                              ? imgPath 
                              : supabase.storage.from('ait-images').getPublicUrl(imgPath).data.publicUrl;
                            
                            return (
                              <a 
                                key={idx} 
                                href={imageUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary transition-colors"
                              >
                                <img 
                                  src={imageUrl} 
                                  alt={`Imagem ${idx + 1}`} 
                                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    console.log('Image load error for:', imgPath);
                                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                                  }}
                                />
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Nenhuma imagem anexada</p>
                      )}
                    </div>
                  </div>

                  {selectedAIT.status === "pendente" && (
                    <div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
                      <Button 
                        className="gap-2 bg-success hover:bg-success/90"
                        onClick={() => { handleApproveAIT(selectedAIT.id); setSelectedAIT(null); }}
                        disabled={updateAITStatus.isPending}
                      >
                        {updateAITStatus.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Aprovar
                      </Button>
                      <Button 
                        variant="destructive" 
                        onClick={() => { handleRejectAIT(selectedAIT.id); setSelectedAIT(null); }} 
                        className="gap-2"
                        disabled={updateAITStatus.isPending}
                      >
                        <X className="h-4 w-4" />
                        Recusar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AIT List */}
            <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
              {aitsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : filteredAITs.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchTerm ? "Nenhum AIT encontrado." : "Nenhum AIT registrado ainda."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 font-semibold text-sm">ID</th>
                        <th className="text-left p-4 font-semibold text-sm">Policial</th>
                        <th className="text-left p-4 font-semibold text-sm">Motorista</th>
                        <th className="text-left p-4 font-semibold text-sm">Placa</th>
                        <th className="text-left p-4 font-semibold text-sm">Data</th>
                        <th className="text-left p-4 font-semibold text-sm">Status</th>
                        <th className="text-right p-4 font-semibold text-sm">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredAITs.map((ait) => (
                        <tr key={ait.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">#{ait.numero_ait}</td>
                          <td className="p-4">{ait.nome_agente}</td>
                          <td className="p-4">{ait.nome_condutor}</td>
                          <td className="p-4 font-mono">{ait.emplacamento}</td>
                          <td className="p-4 text-muted-foreground">{new Date(ait.created_at).toLocaleDateString('pt-BR')}</td>
                          <td className="p-4">{getStatusBadge(ait.status)}</td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button size="icon" variant="ghost" onClick={() => setSelectedAIT(ait)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              {ait.status === "pendente" && (
                                <>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="text-success hover:text-success" 
                                    onClick={() => handleApproveAIT(ait.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="text-destructive hover:text-destructive" 
                                    onClick={() => handleRejectAIT(ait.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
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
              <h1 className="font-display text-lg font-bold text-sidebar-foreground">TRÂNSITO</h1>
              <p className="text-xs text-sidebar-foreground/60">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
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
          {(userRole === "admin" || userRole === "moderador") && (
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
