import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  FileText
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [statusFilter, setStatusFilter] = useState<"todos" | "pendente" | "aprovado" | "recusado">("todos");
  const [selectedPonto, setSelectedPonto] = useState<PontoEletronico | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary">Pendente</span>;
      case "aprovado":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-success/20 text-success">Aprovado</span>;
      case "recusado":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-destructive/20 text-destructive">Recusado</span>;
      case "ativo":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-600">Ativo</span>;
      case "pausado":
        return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-600">Pausado</span>;
      default:
        return null;
    }
  };

  const filteredPontos = pontos.filter((ponto) => {
    // Only show finalized pontos (pendente, aprovado, recusado)
    if (!["pendente", "aprovado", "recusado"].includes(ponto.status)) return false;
    
    if (statusFilter !== "todos" && ponto.status !== statusFilter) return false;
    
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ponto.nome_policial?.toLowerCase().includes(term) ||
      ponto.patente?.toLowerCase().includes(term)
    );
  });

  const handleApprove = async (id: string) => {
    try {
      await approvePonto.mutateAsync(id);
      toast({ title: "Ponto Aprovado", description: "O ponto foi aprovado com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao aprovar ponto.", variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectPonto.mutateAsync({ pontoId: id });
      toast({ title: "Ponto Recusado", description: "O ponto foi recusado.", variant: "destructive" });
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
    doc.text(`Status: ${ponto.status.toUpperCase()}`, 14, 49);
    doc.text(`Início: ${new Date(ponto.data_inicio).toLocaleString("pt-BR")}`, 14, 56);
    if (ponto.data_fim) {
      doc.text(`Término: ${new Date(ponto.data_fim).toLocaleString("pt-BR")}`, 14, 63);
    }
    doc.text(`Duração Total: ${formatDuration(ponto.tempo_total_segundos || 0)}`, 14, 70);
    
    doc.save(`ponto-${ponto.patente}-${ponto.nome_policial}.pdf`);
  };

  const exportAllPontosPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Relatório Geral - Pontos Eletrônicos", 14, 22);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 30);
    
    const tableData = filteredPontos.map(p => [
      `${p.patente || ""} ${p.nome_policial || ""}`,
      funcoesLabel[p.funcao] || p.funcao,
      new Date(p.data_inicio).toLocaleDateString("pt-BR"),
      formatDuration(p.tempo_total_segundos || 0),
      p.status.toUpperCase()
    ]);
    
    autoTable(doc, {
      head: [["Policial", "Função", "Data", "Duração", "Status"]],
      body: tableData,
      startY: 38,
    });
    
    doc.save("relatorio-pontos-eletronicos.pdf");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-display text-2xl font-bold">Ponto Eletrônico</h2>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar policial..." 
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
          <Button 
            variant="outline" 
            onClick={exportAllPontosPDF}
            className="gap-2"
            disabled={filteredPontos.length === 0}
          >
            <Download className="h-4 w-4" />
            Relatório PDF
          </Button>
        </div>
      </div>

      {/* Selected Ponto Modal */}
      {selectedPonto && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-2xl font-bold">Detalhes do Ponto</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedPonto.data_inicio).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {getStatusBadge(selectedPonto.status)}
                <Button size="icon" variant="ghost" onClick={() => setSelectedPonto(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Policial</p>
                  <p className="font-semibold">{selectedPonto.patente} {selectedPonto.nome_policial}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Função</p>
                  <p className="font-semibold">{funcoesLabel[selectedPonto.funcao] || selectedPonto.funcao}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Início</p>
                  <p className="font-semibold">{new Date(selectedPonto.data_inicio).toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Término</p>
                  <p className="font-semibold">
                    {selectedPonto.data_fim 
                      ? new Date(selectedPonto.data_fim).toLocaleString("pt-BR")
                      : "-"
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duração Total</p>
                  <p className="font-semibold text-xl font-mono">
                    {formatDuration(selectedPonto.tempo_total_segundos || 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
              {selectedPonto.status === "pendente" && (
                <>
                  <Button 
                    className="gap-2 bg-success hover:bg-success/90"
                    onClick={() => { handleApprove(selectedPonto.id); setSelectedPonto(null); }}
                    disabled={approvePonto.isPending}
                  >
                    <Check className="h-4 w-4" />
                    Aprovar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => { handleReject(selectedPonto.id); setSelectedPonto(null); }} 
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Recusar
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => exportPontoPDF(selectedPonto)} className="gap-2">
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => setSelectedPonto(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pontos List */}
      <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : filteredPontos.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{searchTerm ? "Nenhum ponto encontrado." : "Nenhum ponto registrado ainda."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Policial</th>
                  <th className="text-left p-4 font-semibold text-sm">Função</th>
                  <th className="text-left p-4 font-semibold text-sm">Data</th>
                  <th className="text-left p-4 font-semibold text-sm">Duração</th>
                  <th className="text-left p-4 font-semibold text-sm">Status</th>
                  <th className="text-right p-4 font-semibold text-sm">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredPontos.map((ponto) => (
                  <tr key={ponto.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{ponto.patente} {ponto.nome_policial}</td>
                    <td className="p-4">{funcoesLabel[ponto.funcao] || ponto.funcao}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(ponto.data_inicio).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4 font-mono">
                      {formatDuration(ponto.tempo_total_segundos || 0)}
                    </td>
                    <td className="p-4">{getStatusBadge(ponto.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => setSelectedPonto(ponto)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => exportPontoPDF(ponto)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        {ponto.status === "pendente" && (
                          <>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-success hover:text-success" 
                              onClick={() => handleApprove(ponto.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-destructive hover:text-destructive" 
                              onClick={() => handleReject(ponto.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(ponto.id)}
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
};
