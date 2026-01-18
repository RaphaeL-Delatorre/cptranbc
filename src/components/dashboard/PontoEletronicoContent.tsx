import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListPagination } from "@/components/common/ListPagination";
import { useToast } from "@/hooks/use-toast";
import {
  usePontosEletronicos,
  useApprovePonto,
  useRejectPonto,
  useDeletePonto,
  useDeleteAllPontos,
  formatDuration,
  type PontoEletronico,
} from "@/hooks/usePontoEletronico";
import { useAuth } from "@/hooks/useAuth";
import { useHasPermission } from "@/hooks/usePermissions";
import { exportPontosToCSV, exportPontosToExcel } from "@/utils/pontoExport";
import { exportPontosToPDF } from "@/utils/pontoPdfExport";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Loader2,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";


type TabType = "pendentes" | "aprovados" | "recusados";
type SortBy = "created_at" | "data_inicio" | "nome_policial";
type SortDir = "desc" | "asc";
type PerPage = 10 | 25 | 50 | 100;

const funcoesLabel: Record<PontoEletronico["funcao"], string> = {
  motorista: "Motorista",
  encarregado: "Encarregado",
  patrulheiro: "3° Homem",
  apoio: "4° Homem",
};

const toDateOnlyValue = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const parseDateOnly = (value: string) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
};

export const PontoEletronicoContent = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: pontos = [], isLoading } = usePontosEletronicos();

  const approvePonto = useApprovePonto();
  const rejectPonto = useRejectPonto();
  const deletePonto = useDeletePonto();
  const deleteAllPontos = useDeleteAllPontos();

  const { data: canManagePonto = false } = useHasPermission("gerenciar_ponto", user?.id);

  const [activeTab, setActiveTab] = useState<TabType>("pendentes");
  const [selectedPonto, setSelectedPonto] = useState<PontoEletronico | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<PontoEletronico | null>(null);
  const [motivoRecusa, setMotivoRecusa] = useState("");

  // Filters
  const [dateStart, setDateStart] = useState<string>("");
  const [dateEnd, setDateEnd] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortBy>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [viaturaFilter, setViaturaFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<PerPage>(10);

  const totals = useMemo(() => {
    const relevant = pontos.filter((p) => ["pendente", "aprovado", "recusado"].includes(p.status));
    return {
      total: relevant.length,
      pendentes: relevant.filter((p) => p.status === "pendente").length,
      aprovados: relevant.filter((p) => p.status === "aprovado").length,
      recusados: relevant.filter((p) => p.status === "recusado").length,
    };
  }, [pontos]);

  const viaturaOptions = useMemo(() => {
    const values = new Set<string>();
    pontos.forEach((p) => {
      if (p.viatura) values.add(p.viatura);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [pontos]);

  const baseFiltered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const startDate = dateStart ? parseDateOnly(dateStart) : null;
    const endDate = dateEnd ? parseDateOnly(dateEnd) : null;

    return pontos.filter((ponto) => {
      if (!["pendente", "aprovado", "recusado"].includes(ponto.status)) return false;

      if (viaturaFilter !== "all" && ponto.viatura !== viaturaFilter) return false;

      if (startDate || endDate) {
        const pDate = new Date(ponto.data_inicio);
        const pDateOnly = parseDateOnly(toDateOnlyValue(pDate));
        if (startDate && pDateOnly < startDate) return false;
        if (endDate && pDateOnly > endDate) return false;
      }

      if (!term) return true;
      const haystack = [
        ponto.nome_policial ?? "",
        ponto.patente ?? "",
        ponto.viatura ?? "",
        ponto.funcao,
        ponto.ponto_discord ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [pontos, dateStart, dateEnd, searchTerm, viaturaFilter]);

  const filteredCounts = useMemo(() => {
    return {
      pendentes: baseFiltered.filter((p) => p.status === "pendente").length,
      aprovados: baseFiltered.filter((p) => p.status === "aprovado").length,
      recusados: baseFiltered.filter((p) => p.status === "recusado").length,
    };
  }, [baseFiltered]);

  const filteredPontos = useMemo(() => {
    const status = activeTab.slice(0, -1) as PontoEletronico["status"]; // pendentes -> pendente

    const sorted = baseFiltered
      .filter((p) => p.status === status)
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;

        if (sortBy === "nome_policial") {
          return (a.nome_policial ?? "").localeCompare(b.nome_policial ?? "") * dir;
        }

        if (sortBy === "data_inicio") {
          return (new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()) * dir;
        }

        // created_at
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      });

    return sorted;
  }, [activeTab, baseFiltered, sortBy, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, dateStart, dateEnd, sortBy, sortDir, searchTerm, viaturaFilter, perPage]);

  const paginatedPontos = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filteredPontos.slice(start, end);
  }, [filteredPontos, page, perPage]);

  const clearFilters = () => {
    setDateStart("");
    setDateEnd("");
    setSortBy("created_at");
    setSortDir("desc");
    setSearchTerm("");
    setViaturaFilter("all");
    setPage(1);
  };

  const getStatusBadge = (status: PontoEletronico["status"]) => {
    if (status === "pendente") {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/15 text-primary">
          Pendente
        </span>
      );
    }

    if (status === "aprovado") {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-success/15 text-success">
          Aprovado
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-destructive/15 text-destructive">
        Recusado
      </span>
    );
  };

  const tabs = [
    { id: "pendentes" as TabType, label: "Pendentes", icon: AlertCircle, count: filteredCounts.pendentes },
    { id: "aprovados" as TabType, label: "Aprovados", icon: CheckCircle, count: filteredCounts.aprovados },
    { id: "recusados" as TabType, label: "Reprovados", icon: XCircle, count: filteredCounts.recusados },
  ];

  const handleApprove = async (id: string) => {
    try {
      await approvePonto.mutateAsync(id);
      toast({ title: "Ponto aprovado", description: "O ponto foi aprovado com sucesso." });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Erro ao aprovar ponto.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!showRejectModal) return;
    try {
      await rejectPonto.mutateAsync({ pontoId: showRejectModal.id, motivo: motivoRecusa });
      toast({ title: "Ponto recusado", description: "O ponto foi recusado.", variant: "destructive" });
      setShowRejectModal(null);
      setMotivoRecusa("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Erro ao recusar ponto.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ponto?")) return;
    try {
      await deletePonto.mutateAsync(id);
      toast({ title: "Ponto excluído", description: "O ponto foi removido." });
      if (selectedPonto?.id === id) setSelectedPonto(null);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Erro ao excluir ponto.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold">Ponto Eletrônico</h2>
          <p className="text-sm text-muted-foreground">Gerencie, filtre e acompanhe os pontos por status.</p>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          {canManagePonto && (
            <Button
              variant="destructive"
              onClick={async () => {
                if (
                  confirm(
                    "Tem certeza que deseja DELETAR TODOS os pontos? Esta ação não pode ser desfeita."
                  )
                ) {
                  try {
                    await deleteAllPontos.mutateAsync();
                    toast({ title: "Pontos deletados", description: "Todos os pontos foram removidos." });
                  } catch (error: any) {
                    toast({
                      title: "Erro",
                      description: error?.message || "Erro ao deletar pontos.",
                      variant: "destructive",
                    });
                  }
                }
              }}
              disabled={deleteAllPontos.isPending}
              className="gap-2"
            >
              {deleteAllPontos.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              Deletar todos
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() =>
              exportPontosToPDF(
                filteredPontos,
                `pontos-${activeTab}-${new Date().toISOString().slice(0, 10)}.pdf`
              )
            }
            className="gap-2"
            disabled={filteredPontos.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              exportPontosToCSV(
                filteredPontos,
                `pontos-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
            className="gap-2"
            disabled={filteredPontos.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              exportPontosToExcel(
                filteredPontos,
                `pontos-${activeTab}-${new Date().toISOString().slice(0, 10)}.xlsx`
              )
            }
            className="gap-2"
            disabled={filteredPontos.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totals.total}</p>
              <p className="text-sm text-muted-foreground">Total de Pontos</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totals.pendentes}</p>
              <p className="text-sm text-muted-foreground">Pendentes</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totals.aprovados}</p>
              <p className="text-sm text-muted-foreground">Aprovados</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totals.recusados}</p>
              <p className="text-sm text-muted-foreground">Reprovados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl shadow-card border border-border/50">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-lg font-bold">Filtros</h3>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">Data de Início</label>
              <Input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Data de Fim</label>
              <Input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Viatura/Prefixo</label>
              <Select value={viaturaFilter} onValueChange={setViaturaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {viaturaOptions.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Ordenar por</label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Data de Criação</SelectItem>
                  <SelectItem value="data_inicio">Data do Ponto</SelectItem>
                  <SelectItem value="nome_policial">Nome do Policial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Ordem</label>
              <Select value={sortDir} onValueChange={(v) => setSortDir(v as SortDir)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Mais Recente</SelectItem>
                  <SelectItem value="asc">Mais Antigo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, prefixo ou viatura..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
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
            <h3 className="font-display text-xl font-bold mb-2">Recusar Ponto</h3>
            <p className="text-muted-foreground mb-4">Informe o motivo da recusa:</p>
            <Textarea
              value={motivoRecusa}
              onChange={(e) => setMotivoRecusa(e.target.value)}
              placeholder="Motivo da recusa..."
              className="mb-4"
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectPonto.isPending}
                className="gap-2"
              >
                {rejectPonto.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <X className="h-4 w-4" />
                Confirmar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(null);
                  setMotivoRecusa("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
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
                    <p className="font-semibold">{funcoesLabel[selectedPonto.funcao]}</p>
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
                  <p className="font-semibold text-xl font-mono">{formatDuration(selectedPonto.tempo_total_segundos || 0)}</p>
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

            {selectedPonto.status === "pendente" && canManagePonto && (
              <div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
                <Button
                  className="gap-2 bg-success hover:bg-success/90"
                  onClick={async () => {
                    await handleApprove(selectedPonto.id);
                    setSelectedPonto(null);
                  }}
                  disabled={approvePonto.isPending}
                >
                  <Check className="h-4 w-4" />
                  Aprovar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowRejectModal(selectedPonto);
                    setSelectedPonto(null);
                  }}
                  className="gap-2"
                  disabled={rejectPonto.isPending}
                >
                  <X className="h-4 w-4" />
                  Reprovar
                </Button>
              </div>
            )}

            {canManagePonto && (
              <div className="flex gap-2 mt-4">
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => handleDelete(selectedPonto.id)}
                  disabled={deletePonto.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Apagar este ponto
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : filteredPontos.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            {searchTerm || dateStart || dateEnd
              ? "Nenhum ponto encontrado com estes filtros."
              : "Nenhum ponto encontrado."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm whitespace-nowrap">Data</th>
                  <th className="text-left p-4 font-semibold text-sm whitespace-nowrap">Graduação</th>
                  <th className="text-left p-4 font-semibold text-sm">Nome</th>
                  <th className="text-left p-4 font-semibold text-sm whitespace-nowrap">Prefixo</th>
                  <th className="text-left p-4 font-semibold text-sm whitespace-nowrap">Duração</th>
                  <th className="text-left p-4 font-semibold text-sm whitespace-nowrap">Status</th>
                  {activeTab !== "pendentes" && (
                    <th className="text-left p-4 font-semibold text-sm whitespace-nowrap">
                      Responsável
                    </th>
                  )}
                  <th className="text-right p-4 font-semibold text-sm whitespace-nowrap">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginatedPontos.map((ponto) => (
                  <tr key={ponto.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                      {new Date(ponto.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-4 whitespace-nowrap">{ponto.patente || "-"}</td>
                    <td className="p-4">
                      <span className="font-medium">{ponto.nome_policial || "-"}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">{ponto.viatura || "-"}</td>
                    <td className="p-4 font-mono whitespace-nowrap">
                      {formatDuration(ponto.tempo_total_segundos || 0)}
                    </td>
                    <td className="p-4 whitespace-nowrap">{getStatusBadge(ponto.status)}</td>
                    {activeTab !== "pendentes" && (
                      <td className="p-4 text-sm whitespace-nowrap">{ponto.aprovador_nome || "-"}</td>
                    )}
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setSelectedPonto(ponto)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManagePonto && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(ponto.id)}
                            title="Deletar"
                            disabled={deletePonto.isPending}
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

        {!isLoading && filteredPontos.length > 0 && (
          <ListPagination
            page={page}
            perPage={perPage}
            totalItems={filteredPontos.length}
            onPageChange={setPage}
            onPerPageChange={(v) => {
              setPerPage(v);
              setPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
};
