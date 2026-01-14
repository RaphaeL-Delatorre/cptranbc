import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  usePontosEletronicos, 
  useApprovePonto, 
  useRejectPonto, 
  useDeletePonto,
  formatDuration,
  type PontoEletronico
} from "@/hooks/usePontoEletronico";
import { 
  Clock, 
  Check, 
  X, 
  Eye, 
  Download, 
  Trash2, 
  Search,
  Loader2,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const funcoesLabel: Record<string, string> = {
  motorista: "Motorista",
  encarregado: "Encarregado",
  patrulheiro: "3° Homem",
  apoio: "4° Homem",
};

export const PontoEletronicoContent = () => {
  const { toast } = useToast();
  const { data: pontos = [], isLoading } = usePontosEletronicos();
  const approvePonto = useApprovePonto();
  const rejectPonto = useRejectPonto();
  const deletePonto = useDeletePonto();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPonto, setSelectedPonto] = useState<PontoEletronico | null>(null);
  const [rejectingPonto, setRejectingPonto] = useState<PontoEletronico | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");

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

  const filterByStatus = (status: string) => {
    return pontos.filter((ponto) => {
      if (!["pendente", "aprovado", "recusado"].includes(ponto.status)) return false;
      if (ponto.status !== status) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        ponto.nome_policial?.toLowerCase().includes(term) ||
        ponto.patente?.toLowerCase().includes(term)
      );
    });
  };

  const handleApprove = async (id: string) => {
    try {
      await approvePonto.mutateAsync(id);
      toast({ title: "Ponto Aprovado", description: "O ponto foi aprovado com sucesso." });
      setSelectedPonto(null);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao aprovar ponto.", variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!rejectingPonto) return;
    try {
      await rejectPonto.mutateAsync({ pontoId: rejectingPonto.id, motivo: motivoRecusa });
      toast({ title: "Ponto Recusado", description: "O ponto foi recusado.", variant: "destructive" });
      setRejectingPonto(null);
      setMotivoRecusa("");
      setSelectedPonto(null);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao recusar ponto.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ponto?")) return;
    try {
      await deletePonto.mutateAsync(id);
      toast({ title: "Ponto Excluído", description: "O ponto foi removido." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao excluir ponto.", variant: "destructive" });
    }
  };

  const exportPontoPDF = (ponto: PontoEletronico) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório de Ponto Eletrônico", 14, 22);
    doc.setFontSize(12);
    doc.text(`Policial: ${ponto.patente} ${ponto.nome_policial}`, 14, 35);
    doc.text(`Função: ${funcoesLabel[ponto.funcao] || ponto.funcao}`, 14, 42);
    doc.text(`Viatura: ${ponto.viatura || "-"}`, 14, 49);
    doc.text(`Status: ${ponto.status.toUpperCase()}`, 14, 56);
    doc.text(`Início: ${new Date(ponto.data_inicio).toLocaleString("pt-BR")}`, 14, 63);
    if (ponto.data_fim) {
      doc.text(`Término: ${new Date(ponto.data_fim).toLocaleString("pt-BR")}`, 14, 70);
    }
    doc.text(`Duração Total: ${formatDuration(ponto.tempo_total_segundos || 0)}`, 14, 77);
    if (ponto.aprovador_nome) {
      doc.text(`${ponto.status === "aprovado" ? "Aprovado" : "Recusado"} por: ${ponto.aprovador_nome}`, 14, 84);
    }
    if (ponto.motivo_recusa) {
      doc.text(`Motivo da Recusa: ${ponto.motivo_recusa}`, 14, 91);
    }
    doc.save(`ponto-${ponto.patente}-${ponto.nome_policial}.pdf`);
  };

  const exportAllPontosPDF = (pontosList: PontoEletronico[]) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório Geral - Pontos Eletrônicos", 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 30);
    
    const tableData = pontosList.map(p => [
      `${p.patente || ""} ${p.nome_policial || ""}`,
      funcoesLabel[p.funcao] || p.funcao,
      p.viatura || "-",
      new Date(p.data_inicio).toLocaleDateString("pt-BR"),
      formatDuration(p.tempo_total_segundos || 0),
      p.status.toUpperCase()
    ]);
    
    autoTable(doc, {
      head: [["Policial", "Função", "Viatura", "Data", "Duração", "Status"]],
      body: tableData,
      startY: 38,
    });
    
    doc.save("relatorio-pontos-eletronicos.pdf");
  };

  const renderTable = (pontosList: PontoEletronico[], showActions: boolean = false) => (
    <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
      {isLoading ? (
        <div className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : pontosList.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum ponto encontrado.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold text-sm">Policial</th>
                <th className="text-left p-4 font-semibold text-sm">Função</th>
                <th className="text-left p-4 font-semibold text-sm">Viatura</th>
                <th className="text-left p-4 font-semibold text-sm">Data</th>
                <th className="text-left p-4 font-semibold text-sm">Duração</th>
                <th className="text-right p-4 font-semibold text-sm">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {pontosList.map((ponto) => (
                <tr key={ponto.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{ponto.patente} {ponto.nome_policial}</td>
                  <td className="p-4">{funcoesLabel[ponto.funcao] || ponto.funcao}</td>
                  <td className="p-4">{ponto.viatura || "-"}</td>
                  <td className="p-4 text-muted-foreground">{new Date(ponto.data_inicio).toLocaleDateString('pt-BR')}</td>
                  <td className="p-4 font-mono">{formatDuration(ponto.tempo_total_segundos || 0)}</td>
                  <td className="p-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="icon" variant="ghost" onClick={() => setSelectedPonto(ponto)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => exportPontoPDF(ponto)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      {showActions && (
                        <>
                          <Button size="icon" variant="ghost" className="text-success hover:text-success" onClick={() => handleApprove(ponto.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setRejectingPonto(ponto)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(ponto.id)}>
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
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-display text-2xl font-bold">Ponto Eletrônico</h2>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar policial..." className="pl-9 w-48" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingPonto && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-display text-xl font-bold mb-4">Recusar Ponto</h3>
            <p className="text-muted-foreground mb-4">Informe o motivo da recusa:</p>
            <Textarea value={motivoRecusa} onChange={(e) => setMotivoRecusa(e.target.value)} placeholder="Motivo da recusa..." className="mb-4" />
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleReject} disabled={rejectPonto.isPending}>
                {rejectPonto.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Recusar
              </Button>
              <Button variant="outline" onClick={() => { setRejectingPonto(null); setMotivoRecusa(""); }}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedPonto && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-2xl font-bold">Detalhes do Ponto</h3>
                <p className="text-sm text-muted-foreground">{new Date(selectedPonto.data_inicio).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedPonto.status)}
                <Button size="icon" variant="ghost" onClick={() => setSelectedPonto(null)}><X className="h-5 w-5" /></Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Policial</p><p className="font-semibold">{selectedPonto.patente} {selectedPonto.nome_policial}</p></div>
                <div><p className="text-sm text-muted-foreground">Função</p><p className="font-semibold">{funcoesLabel[selectedPonto.funcao] || selectedPonto.funcao}</p></div>
                <div><p className="text-sm text-muted-foreground">Viatura</p><p className="font-semibold">{selectedPonto.viatura || "-"}</p></div>
                <div><p className="text-sm text-muted-foreground">Ponto Discord</p><p className="font-semibold">{selectedPonto.ponto_discord || "-"}</p></div>
                <div><p className="text-sm text-muted-foreground">Início</p><p className="font-semibold">{new Date(selectedPonto.data_inicio).toLocaleString("pt-BR")}</p></div>
                <div><p className="text-sm text-muted-foreground">Término</p><p className="font-semibold">{selectedPonto.data_fim ? new Date(selectedPonto.data_fim).toLocaleString("pt-BR") : "-"}</p></div>
                <div><p className="text-sm text-muted-foreground">Duração Total</p><p className="font-semibold text-xl font-mono">{formatDuration(selectedPonto.tempo_total_segundos || 0)}</p></div>
              </div>
              
              {selectedPonto.aprovador_nome && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">{selectedPonto.status === "aprovado" ? "Aprovado por" : "Recusado por"}</p>
                  <p className="font-semibold">{selectedPonto.aprovador_nome}</p>
                  {selectedPonto.data_aprovacao && <p className="text-xs text-muted-foreground">em {new Date(selectedPonto.data_aprovacao).toLocaleString("pt-BR")}</p>}
                </div>
              )}
              
              {selectedPonto.motivo_recusa && (
                <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-sm text-muted-foreground">Motivo da Recusa</p>
                  <p className="font-semibold text-destructive">{selectedPonto.motivo_recusa}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
              {selectedPonto.status === "pendente" && (
                <>
                  <Button className="gap-2 bg-success hover:bg-success/90" onClick={() => handleApprove(selectedPonto.id)} disabled={approvePonto.isPending}>
                    <Check className="h-4 w-4" />Aprovar
                  </Button>
                  <Button variant="destructive" onClick={() => setRejectingPonto(selectedPonto)} className="gap-2">
                    <X className="h-4 w-4" />Recusar
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => exportPontoPDF(selectedPonto)} className="gap-2"><Download className="h-4 w-4" />PDF</Button>
              <Button variant="outline" onClick={() => setSelectedPonto(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="pendente" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pendente">Pendentes ({filterByStatus("pendente").length})</TabsTrigger>
          <TabsTrigger value="aprovado">Aprovados ({filterByStatus("aprovado").length})</TabsTrigger>
          <TabsTrigger value="recusado">Recusados ({filterByStatus("recusado").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="pendente" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={() => exportAllPontosPDF(filterByStatus("pendente"))} disabled={filterByStatus("pendente").length === 0} className="gap-2">
              <Download className="h-4 w-4" />Relatório PDF
            </Button>
          </div>
          {renderTable(filterByStatus("pendente"), true)}
        </TabsContent>
        <TabsContent value="aprovado" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={() => exportAllPontosPDF(filterByStatus("aprovado"))} disabled={filterByStatus("aprovado").length === 0} className="gap-2">
              <Download className="h-4 w-4" />Relatório PDF
            </Button>
          </div>
          {renderTable(filterByStatus("aprovado"))}
        </TabsContent>
        <TabsContent value="recusado" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={() => exportAllPontosPDF(filterByStatus("recusado"))} disabled={filterByStatus("recusado").length === 0} className="gap-2">
              <Download className="h-4 w-4" />Relatório PDF
            </Button>
          </div>
          {renderTable(filterByStatus("recusado"))}
        </TabsContent>
      </Tabs>
    </div>
  );
};