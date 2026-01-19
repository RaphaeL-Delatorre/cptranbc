import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListPagination } from "@/components/common/ListPagination";
import { useToast } from "@/hooks/use-toast";
import {
  useAITs,
  useDeleteAIT,
  useDeleteAllAITs,
  type AIT,
  useUpdateAITStatus,
} from "@/hooks/useAITs";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useRoles";
import { exportAITToPDF, exportAllAITsToPDF } from "@/utils/pdfExport";
import { exportAITsToCSV, exportAITsToExcel } from "@/utils/aitExport";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  Download,
  Eye,
  FileText,
  Loader2,
  Search,
  Trash2,
  User,
  X,
  XCircle,
  Camera,
} from "lucide-react";

type AITTabType = "pendentes" | "aprovados" | "recusados";
type SortBy = "created_at" | "data_ait" | "nome_agente";
type SortDir = "desc" | "asc";

type PerPage = 10 | 25 | 50 | 100;

const statusLabel: Record<AIT["status"], string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Reprovado",
};

const toDateOnlyValue = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getAITDateISO = (ait: AIT) => {
  // Prefer the AIT period start ("Data do AIT"), fallback to creation
  return (ait.data_inicio || ait.created_at) as string;
};

const parseDateOnly = (value: string) => {
  // value is yyyy-mm-dd
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
};

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
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);

  // Proteção extra para "Deletar todos"
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllPhrase, setDeleteAllPhrase] = useState("");

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

  const userRole =
    userRoles.find((r) => r.role === "admin")?.role === "admin"
      ? "admin"
      : userRoles.find((r) => r.role === "moderador")?.role === "moderador"
        ? "moderador"
        : null;

  const totals = useMemo(() => {
    const total = aits.length;
    const pendentes = aits.filter((a) => a.status === "pendente").length;
    const aprovados = aits.filter((a) => a.status === "aprovado").length;
    const recusados = aits.filter((a) => a.status === "recusado").length;
    return { total, pendentes, aprovados, recusados };
  }, [aits]);

  const viaturaOptions = useMemo(() => {
    const values = new Set<string>();
    aits.forEach((a) => {
      if (a.viatura) values.add(a.viatura);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [aits]);

  const baseFiltered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const hasStart = Boolean(dateStart);
    const hasEnd = Boolean(dateEnd);
    const startDate = hasStart ? parseDateOnly(dateStart) : null;
    const endDate = hasEnd ? parseDateOnly(dateEnd) : null;

    return aits.filter((ait) => {
      // Quick filter (viatura/prefixo)
      if (viaturaFilter !== "all" && ait.viatura !== viaturaFilter) return false;

      // Date filter (by "data do AIT" when exists)
      if (startDate || endDate) {
        const aitDate = new Date(getAITDateISO(ait));
        const aitDateOnly = parseDateOnly(toDateOnlyValue(aitDate));

        if (startDate && aitDateOnly < startDate) return false;
        if (endDate && aitDateOnly > endDate) return false;
      }

      // Search filter
      if (!term) return true;
      const haystack = [
        ait.nome_agente,
        ait.graduacao,
        ait.viatura,
        ait.primeiro_homem,
        ait.segundo_homem || "",
        ait.terceiro_homem || "",
        ait.nome_condutor,
        ait.emplacamento,
        ait.marca_modelo,
        String(ait.numero_ait),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [aits, dateEnd, dateStart, searchTerm, viaturaFilter]);


  const filteredCounts = useMemo(() => {
    return {
      pendentes: baseFiltered.filter((a) => a.status === "pendente").length,
      aprovados: baseFiltered.filter((a) => a.status === "aprovado").length,
      recusados: baseFiltered.filter((a) => a.status === "recusado").length,
    };
  }, [baseFiltered]);

  const filteredAITs = useMemo(() => {
    const status = activeTab.slice(0, -1) as AIT["status"]; // pendentes -> pendente

    const sorted = baseFiltered
      .filter((ait) => ait.status === status)
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;

        if (sortBy === "nome_agente") {
          return a.nome_agente.localeCompare(b.nome_agente) * dir;
        }

        if (sortBy === "data_ait") {
          const ad = new Date(getAITDateISO(a)).getTime();
          const bd = new Date(getAITDateISO(b)).getTime();
          return (ad - bd) * dir;
        }

        // created_at
        const ac = new Date(a.created_at).getTime();
        const bc = new Date(b.created_at).getTime();
        return (ac - bc) * dir;
      });

    return sorted;
  }, [activeTab, baseFiltered, sortBy, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, dateStart, dateEnd, sortBy, sortDir, searchTerm, viaturaFilter, perPage]);

  const paginatedAITs = useMemo(() => {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filteredAITs.slice(start, end);
  }, [filteredAITs, page, perPage]);


  const handleApproveAIT = async (id: string) => {
    try {
      await updateAITStatus.mutateAsync({ id, status: "aprovado" });
      toast({ title: "AIT aprovado", description: "AIT foi aprovado com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Erro ao aprovar AIT.", variant: "destructive" });
    }
  };

  const handleRejectAIT = async (id: string) => {
    try {
      await updateAITStatus.mutateAsync({
        id,
        status: "recusado",
        motivo_recusa: rejectReason,
      });
      toast({
        title: "AIT reprovado",
        description: "AIT foi reprovado.",
        variant: "destructive",
      });
      setShowRejectModal(null);
      setRejectReason("");
    } catch {
      toast({ title: "Erro", description: "Erro ao reprovar AIT.", variant: "destructive" });
    }
  };

  const clearFilters = () => {
    setDateStart("");
    setDateEnd("");
    setSortBy("created_at");
    setSortDir("desc");
    setSearchTerm("");
    setViaturaFilter("all");
    setPage(1);
  };

  const getStatusBadge = (status: AIT["status"]) => {
    if (status === "pendente") {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-primary/15 text-primary">
          {statusLabel[status]}
        </span>
      );
    }

    if (status === "aprovado") {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-success/15 text-success">
          {statusLabel[status]}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-destructive/15 text-destructive">
        {statusLabel[status]}
      </span>
    );
  };

  const tabs = [
    {
      id: "pendentes" as AITTabType,
      label: "Pendentes",
      icon: AlertCircle,
      count: filteredCounts.pendentes,
    },
    {
      id: "aprovados" as AITTabType,
      label: "Aprovados",
      icon: CheckCircle,
      count: filteredCounts.aprovados,
    },
    {
      id: "recusados" as AITTabType,
      label: "Reprovados",
      icon: XCircle,
      count: filteredCounts.recusados,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold">Dashboard de AITs</h2>
          <p className="text-sm text-muted-foreground">Gerencie, filtre e acompanhe os AITs por status.</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {userRole === "admin" && (
            <>
              <Button
                variant="destructive"
                onClick={() => {
                  setDeleteAllPhrase("");
                  setDeleteAllOpen(true);
                }}
                disabled={deleteAllAITs.isPending}
                className="gap-2"
              >
                {deleteAllAITs.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Trash2 className="h-4 w-4" />
                Deletar todos
              </Button>

              <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Deletar todos os AITs?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é irreversível. Para confirmar, digite <strong>DELETAR</strong> abaixo.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <div className="space-y-2">
                    <Input
                      value={deleteAllPhrase}
                      onChange={(e) => setDeleteAllPhrase(e.target.value)}
                      placeholder='Digite "DELETAR"'
                    />
                    <p className="text-xs text-muted-foreground">
                      Dica: você só conseguirá confirmar quando a frase estiver correta.
                    </p>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel
                      onClick={() => {
                        setDeleteAllOpen(false);
                        setDeleteAllPhrase("");
                      }}
                    >
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={async (e) => {
                        e.preventDefault();
                        if (deleteAllPhrase.trim().toUpperCase() !== "DELETAR") return;
                        try {
                          await deleteAllAITs.mutateAsync();
                          toast({ title: "AITs deletados", description: "Todos os AITs foram removidos." });
                          setDeleteAllOpen(false);
                          setDeleteAllPhrase("");
                        } catch (error: any) {
                          toast({
                            title: "Erro",
                            description: error?.message || "Erro ao deletar AITs.",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={deleteAllPhrase.trim().toUpperCase() !== "DELETAR" || deleteAllAITs.isPending}
                    >
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
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
          <Button
            variant="outline"
            onClick={() =>
              exportAITsToCSV(
                filteredAITs,
                `aits-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
            className="gap-2"
            disabled={filteredAITs.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              exportAITsToExcel(
                filteredAITs,
                `aits-${activeTab}-${new Date().toISOString().slice(0, 10)}.xlsx`
              )
            }
            className="gap-2"
            disabled={filteredAITs.length === 0}
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
              <FileText className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totals.total}</p>
              <p className="text-sm text-muted-foreground">Total de AITs</p>
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
                  <SelectItem value="data_ait">Data do AIT</SelectItem>
                  <SelectItem value="nome_agente">Nome do Policial</SelectItem>
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
            <h3 className="font-display text-xl font-bold mb-2">Reprovar AIT</h3>
            <p className="text-muted-foreground mb-4">Informe o motivo da reprovação:</p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Motivo da reprovação..."
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
                Confirmar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* AIT Detail Modal (kept) */}
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
                        <span
                          key={art}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium"
                        >
                          {art}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Providências</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedAIT.providencias_tomadas?.map((prov) => (
                        <span
                          key={prov}
                          className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium"
                        >
                          {prov}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Imagens, Data e Relatório */}
              <div className="bg-muted/30 rounded-xl p-5 space-y-4">
                <h4 className="font-semibold text-primary text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Imagens, Data e Relatório
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data da ocorrência</p>
                    <p className="font-semibold">
                      {selectedAIT.data_inicio
                        ? new Date(selectedAIT.data_inicio).toLocaleString("pt-BR")
                        : "-"}
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
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {selectedAIT.imagens.map((imgPath, idx) => {
                        const imageUrl = imgPath.startsWith("http")
                          ? imgPath
                          : supabase.storage.from("ait-images").getPublicUrl(imgPath).data.publicUrl;

                        const alt = `Imagem do AIT #${selectedAIT.numero_ait} (${idx + 1})`;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPreviewImage({ url: imageUrl, alt })}
                            className="h-20 w-20 sm:h-24 sm:w-24 rounded-lg overflow-hidden border bg-background/30 hover:bg-background/50 transition-colors"
                            title="Ver imagem"
                          >
                            <img
                              src={imageUrl}
                              alt={alt}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma imagem anexada.</p>
                  )}
                </div>

                {/* Aprovação / Reprovação (sempre no final) */}
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
                          <p className="font-semibold">
                            {new Date(selectedAIT.data_aprovacao).toLocaleDateString("pt-BR")}
                          </p>
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
              </div>

              <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>Imagem do AIT</DialogTitle>
                  </DialogHeader>
                  {previewImage && (
                    <div className="rounded-lg overflow-hidden border bg-background">
                      <img
                        src={previewImage.url}
                        alt={previewImage.alt}
                        className="w-full h-auto max-h-[70vh] object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {selectedAIT.status === "pendente" && (
              <div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
                <Button
                  className="gap-2 bg-success hover:bg-success/90"
                  onClick={() => {
                    handleApproveAIT(selectedAIT.id);
                    setSelectedAIT(null);
                  }}
                  disabled={updateAITStatus.isPending}
                >
                  <Check className="h-4 w-4" />
                  Aprovar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowRejectModal(selectedAIT.id);
                    setSelectedAIT(null);
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Reprovar
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
        {aitsLoading ? (
          <div className="p-10 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : filteredAITs.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">
            {searchTerm || dateStart || dateEnd ? "Nenhum AIT encontrado com estes filtros." : "Nenhum AIT encontrado."}
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
                  <th className="text-left p-4 font-semibold text-sm whitespace-nowrap">Status</th>
                  {activeTab !== "pendentes" && (
                    <th className="text-left p-4 font-semibold text-sm whitespace-nowrap">Responsável</th>
                  )}
                  <th className="text-right p-4 font-semibold text-sm whitespace-nowrap">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {paginatedAITs.map((ait) => (
                  <tr key={ait.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                      {new Date(ait.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-4 whitespace-nowrap">{ait.graduacao}</td>
                    <td className="p-4">
                      <span className="font-medium">{ait.nome_agente}</span>
                    </td>
                    <td className="p-4 whitespace-nowrap">{ait.viatura}</td>
                    <td className="p-4 whitespace-nowrap">{getStatusBadge(ait.status)}</td>
                    {activeTab !== "pendentes" && (
                      <td className="p-4 text-sm whitespace-nowrap">{ait.aprovador_nome || "-"}</td>
                    )}
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => setSelectedAIT(ait)} title="Ver detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => exportAITToPDF(ait)} title="Exportar PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        {userRole === "admin" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={async () => {
                              if (confirm("Tem certeza que deseja deletar este AIT?")) {
                                try {
                                  await deleteAIT.mutateAsync(ait.id);
                                  toast({ title: "AIT deletado" });
                                } catch (error: any) {
                                  toast({
                                    title: "Erro",
                                    description: error?.message || "Erro ao deletar AIT.",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                            title="Deletar"
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

        {!aitsLoading && filteredAITs.length > 0 && (
          <ListPagination
            page={page}
            perPage={perPage}
            totalItems={filteredAITs.length}
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
