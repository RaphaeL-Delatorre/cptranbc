import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAITs, useUpdateAITStatus, useDeleteAllAITs, useDeleteAIT, type AIT } from "@/hooks/useAITs";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useRoles";
import { exportAITToPDF, exportAllAITsToPDF } from "@/utils/pdfExport";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Check,
  X,
  Eye,
  Search,
  Loader2,
  Download,
  Trash2,
  Camera,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
} from "lucide-react";

type AITTabType = "pendentes" | "aprovados" | "recusados";

export const AITContent = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: userRoles = [] } = useUserRoles(user?.id);
  const { data: aits = [], isLoading: aitsLoading } = useAITs();
  const updateAITStatus = useUpdateAITStatus();
  const deleteAllAITs = useDeleteAllAITs();
  const deleteAIT = useDeleteAIT();

  const [activeTab, setActiveTab] = useState<AITTabType>("pendentes");
  const [selectedAIT, setSelectedAIT] = useState<AIT | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const userRole = userRoles.find(r => r.role === "admin") ? "admin" : 
                   userRoles.find(r => r.role === "moderador") ? "moderador" : null;

  const getFilteredAITs = (status: AITTabType) => {
    return aits.filter((ait) => {
      if (ait.status !== status.slice(0, -1)) return false; // Remove 's' from 'pendentes' -> 'pendente'
      
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        ait.nome_agente.toLowerCase().includes(term) ||
        ait.nome_condutor.toLowerCase().includes(term) ||
        ait.emplacamento.toLowerCase().includes(term) ||
        ait.numero_ait.toString().includes(term)
      );
    });
  };

  const filteredAITs = getFilteredAITs(activeTab);

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
      await updateAITStatus.mutateAsync({ id, status: "recusado", motivo_recusa: rejectReason });
      toast({ title: "AIT Recusado", description: `AIT foi recusado.`, variant: "destructive" });
      setShowRejectModal(null);
      setRejectReason("");
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao recusar AIT.", variant: "destructive" });
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

  const tabs = [
    { id: "pendentes" as AITTabType, label: "Pendentes", icon: AlertCircle, count: aits.filter(a => a.status === "pendente").length },
    { id: "aprovados" as AITTabType, label: "Aprovados", icon: CheckCircle, count: aits.filter(a => a.status === "aprovado").length },
    { id: "recusados" as AITTabType, label: "Recusados", icon: XCircle, count: aits.filter(a => a.status === "recusado").length },
  ];

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
          {userRole === "admin" && (
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirm("Tem certeza que deseja DELETAR TODOS os AITs? Esta ação não pode ser desfeita.")) {
                  try {
                    await deleteAllAITs.mutateAsync();
                    toast({ title: "AITs Deletados", description: "Todos os AITs foram removidos." });
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

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "outline"}
            onClick={() => setActiveTab(tab.id)}
            className="gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span className="ml-1 px-2 py-0.5 rounded-full bg-background/20 text-xs font-bold">
              {tab.count}
            </span>
          </Button>
        ))}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-display text-xl font-bold mb-4">Recusar AIT</h3>
            <p className="text-muted-foreground mb-4">Informe o motivo da recusa:</p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da recusa..."
              className="mb-4"
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => handleRejectAIT(showRejectModal)}
                disabled={updateAITStatus.isPending}
                className="gap-2"
              >
                {updateAITStatus.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <X className="h-4 w-4" />
                Confirmar Recusa
              </Button>
              <Button variant="outline" onClick={() => { setShowRejectModal(null); setRejectReason(""); }}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AIT Detail Modal */}
      {selectedAIT && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-2xl font-bold">AIT #{selectedAIT.numero_ait}</h3>
                <p className="text-sm text-muted-foreground">
                  Criado em {new Date(selectedAIT.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedAIT.status)}
                <Button size="icon" variant="outline" onClick={() => exportAITToPDF(selectedAIT)} title="Exportar PDF">
                  <Download className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setSelectedAIT(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Policial Responsável */}
              <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                <h4 className="font-semibold text-primary text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
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

              {/* Viatura e Equipe */}
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

              {/* Dados do Veículo e Motorista */}
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

              {/* Artigos e Providências */}
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

              {/* Aprovador/Motivo Recusa */}
              {(selectedAIT.aprovador_nome || selectedAIT.motivo_recusa) && (
                <div className={`rounded-xl p-5 space-y-4 ${selectedAIT.status === 'recusado' ? 'bg-destructive/10' : 'bg-success/10'}`}>
                  <h4 className={`font-semibold text-lg ${selectedAIT.status === 'recusado' ? 'text-destructive' : 'text-success'}`}>
                    {selectedAIT.status === 'aprovado' ? 'Aprovação' : 'Recusa'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedAIT.aprovador_nome && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {selectedAIT.status === 'aprovado' ? 'Aprovado por' : 'Recusado por'}
                        </p>
                        <p className="font-semibold">{selectedAIT.aprovador_nome}</p>
                      </div>
                    )}
                    {selectedAIT.data_aprovacao && (
                      <div>
                        <p className="text-sm text-muted-foreground">Data</p>
                        <p className="font-semibold">
                          {new Date(selectedAIT.data_aprovacao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedAIT.motivo_recusa && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Motivo da Recusa</p>
                      <p className="bg-background/50 p-3 rounded-lg">{selectedAIT.motivo_recusa}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Imagens */}
              {selectedAIT.imagens && selectedAIT.imagens.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                  <h4 className="font-semibold text-primary text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Imagens
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {selectedAIT.imagens.map((imgPath, idx) => {
                      const imageUrl = imgPath.startsWith('http') 
                        ? imgPath 
                        : supabase.storage.from('ait-images').getPublicUrl(imgPath).data.publicUrl;
                      
                      return (
                        <a key={idx} href={imageUrl} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-lg overflow-hidden border">
                          <img src={imageUrl} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {selectedAIT.status === "pendente" && (
              <div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
                <Button 
                  className="gap-2 bg-success hover:bg-success/90"
                  onClick={() => { handleApproveAIT(selectedAIT.id); setSelectedAIT(null); }}
                  disabled={updateAITStatus.isPending}
                >
                  <Check className="h-4 w-4" />
                  Aprovar
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => { setShowRejectModal(selectedAIT.id); setSelectedAIT(null); }} 
                  className="gap-2"
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
            {searchTerm ? "Nenhum AIT encontrado." : `Nenhum AIT ${activeTab.slice(0, -1)} encontrado.`}
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
                  {activeTab === "recusados" && (
                    <th className="text-left p-4 font-semibold text-sm">Motivo</th>
                  )}
                  {activeTab !== "pendentes" && (
                    <th className="text-left p-4 font-semibold text-sm">
                      {activeTab === "aprovados" ? "Aprovado por" : "Recusado por"}
                    </th>
                  )}
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
                    <td className="p-4 text-muted-foreground">
                      {new Date(ait.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    {activeTab === "recusados" && (
                      <td className="p-4 max-w-[200px]">
                        <span className="text-sm text-muted-foreground line-clamp-2">
                          {ait.motivo_recusa || "-"}
                        </span>
                      </td>
                    )}
                    {activeTab !== "pendentes" && (
                      <td className="p-4 text-sm">{ait.aprovador_nome || "-"}</td>
                    )}
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => setSelectedAIT(ait)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => exportAITToPDF(ait)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        {activeTab === "pendentes" && (
                          <>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-success hover:text-success"
                              onClick={() => handleApproveAIT(ait.id)}
                              disabled={updateAITStatus.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-destructive hover:text-destructive"
                              onClick={() => setShowRejectModal(ait.id)}
                              disabled={updateAITStatus.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {userRole === "admin" && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="text-destructive hover:text-destructive"
                            onClick={async () => {
                              if (confirm("Tem certeza que deseja deletar este AIT?")) {
                                try {
                                  await deleteAIT.mutateAsync(ait.id);
                                  toast({ title: "AIT Deletado" });
                                } catch (error) {
                                  toast({ title: "Erro", variant: "destructive" });
                                }
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
};