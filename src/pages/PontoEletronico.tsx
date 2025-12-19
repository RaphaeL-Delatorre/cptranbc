import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Loader2, 
  Car,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  useMeusPontos, 
  usePontoAtivo, 
  useIniciarPonto, 
  usePausarPonto, 
  useRetomarPonto, 
  useFinalizarPonto,
  FuncaoViatura,
  PontoEletronico as PontoEletronicoType
} from "@/hooks/usePontoEletronico";
import { useViaturas } from "@/hooks/useViaturas";
import { MainLayout } from "@/components/layout/MainLayout";

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const PontoEletronico = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [selectedViatura, setSelectedViatura] = useState<string>("");
  const [selectedFuncao, setSelectedFuncao] = useState<FuncaoViatura>("patrulheiro");
  const [observacao, setObservacao] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);

  const { data: viaturas = [] } = useViaturas();
  const { data: activePonto, isLoading: loadingActive } = usePontoAtivo(user?.id);
  const { data: userPontos = [], isLoading: loadingPontos } = useMeusPontos(user?.id);
  
  const startPonto = useIniciarPonto();
  const pausePonto = usePausarPonto();
  const resumePonto = useRetomarPonto();
  const finishPonto = useFinalizarPonto();

  // Timer effect
  useEffect(() => {
    if (!activePonto || activePonto.status === "pausado") return;

    const calculateElapsed = () => {
      const start = new Date(activePonto.data_inicio).getTime();
      const now = Date.now();
      let pausedTime = 0;
      
      if (activePonto.pausas && Array.isArray(activePonto.pausas)) {
        (activePonto.pausas as any[]).forEach((pausa: any) => {
          if (pausa.fim) {
            pausedTime += new Date(pausa.fim).getTime() - new Date(pausa.inicio).getTime();
          }
        });
      }
      
      return Math.floor((now - start - pausedTime) / 1000);
    };

    setElapsedTime(calculateElapsed());
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [activePonto]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/admin");
    }
  }, [user, authLoading, navigate]);

  const handleStartPonto = async () => {
    if (!selectedViatura) {
      toast({ title: "Erro", description: "Selecione uma viatura.", variant: "destructive" });
      return;
    }

    try {
      await startPonto.mutateAsync({
        user_id: user!.id,
        viatura_id: selectedViatura,
        funcao: selectedFuncao,
      });
      toast({ title: "Ponto Iniciado", description: "Seu ponto eletrônico foi iniciado com sucesso." });
      setObservacao("");
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Erro ao iniciar ponto.", variant: "destructive" });
    }
  };

  const handlePausePonto = async () => {
    if (!activePonto) return;
    try {
      const pausas = (activePonto.pausas as Array<{ inicio: string; fim?: string }>) || [];
      await pausePonto.mutateAsync({ id: activePonto.id, pausas });
      toast({ title: "Ponto Pausado", description: "Seu ponto foi pausado." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleResumePonto = async () => {
    if (!activePonto) return;
    try {
      const pausas = (activePonto.pausas as Array<{ inicio: string; fim?: string }>) || [];
      await resumePonto.mutateAsync({ id: activePonto.id, pausas });
      toast({ title: "Ponto Retomado", description: "Seu ponto foi retomado." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleFinishPonto = async () => {
    if (!activePonto) return;
    try {
      const pausas = (activePonto.pausas as Array<{ inicio: string; fim?: string }>) || [];
      await finishPonto.mutateAsync({ id: activePonto.id, pausas, dataInicio: activePonto.data_inicio });
      toast({ title: "Ponto Finalizado", description: "Seu ponto foi finalizado e enviado para aprovação." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-success/20 text-success"><Play className="h-3 w-3" /> Ativo</span>;
      case "pausado":
        return <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-warning/20 text-warning"><Pause className="h-3 w-3" /> Pausado</span>;
      case "finalizado":
        return <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground"><Square className="h-3 w-3" /> Finalizado</span>;
      case "pendente":
        return <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary"><AlertCircle className="h-3 w-3" /> Pendente</span>;
      case "aprovado":
        return <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-success/20 text-success"><CheckCircle className="h-3 w-3" /> Aprovado</span>;
      case "recusado":
        return <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-destructive/20 text-destructive"><XCircle className="h-3 w-3" /> Recusado</span>;
      default:
        return null;
    }
  };

  if (authLoading || loadingActive) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-2">
              Ponto <span className="text-primary neon-text">Eletrônico</span>
            </h1>
            <p className="text-muted-foreground">Registre seu horário de trabalho</p>
          </div>

          {/* Active Ponto Card */}
          {activePonto ? (
            <div className="bg-card rounded-2xl p-8 shadow-neon border border-primary/30 mb-8">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">Tempo de Trabalho</p>
                <p className="font-mono text-5xl md:text-6xl font-black text-primary neon-text">
                  {formatDuration(elapsedTime)}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <div className="flex justify-center">{getStatusBadge(activePonto.status)}</div>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Função</p>
                  <p className="font-semibold capitalize">{activePonto.funcao}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Viatura</p>
                  <p className="font-semibold">{viaturas.find(v => v.id === activePonto.viatura_id)?.prefixo || "-"}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Início</p>
                  <p className="font-semibold">{new Date(activePonto.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {activePonto.status === "ativo" && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handlePausePonto}
                      disabled={pausePonto.isPending}
                      className="gap-2 border-warning text-warning hover:bg-warning/10"
                    >
                      {pausePonto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                      Pausar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleFinishPonto}
                      disabled={finishPonto.isPending}
                      className="gap-2"
                    >
                      {finishPonto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                      Finalizar Turno
                    </Button>
                  </>
                )}
                {activePonto.status === "pausado" && (
                  <>
                    <Button 
                      variant="default" 
                      onClick={handleResumePonto}
                      disabled={resumePonto.isPending}
                      className="gap-2"
                    >
                      {resumePonto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Retomar
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleFinishPonto}
                      disabled={finishPonto.isPending}
                      className="gap-2"
                    >
                      {finishPonto.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
                      Finalizar Turno
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 shadow-neon border border-border/50 mb-8">
              <h2 className="font-display text-xl font-bold mb-6 text-center">Iniciar Novo Turno</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Viatura</label>
                  <Select value={selectedViatura} onValueChange={setSelectedViatura}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a viatura" />
                    </SelectTrigger>
                    <SelectContent>
                      {viaturas.filter(v => v.ativa).map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            {v.prefixo} - {v.tipo}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Função</label>
                  <Select value={selectedFuncao} onValueChange={(v) => setSelectedFuncao(v as FuncaoViatura)}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motorista">Motorista</SelectItem>
                      <SelectItem value="encarregado">Encarregado</SelectItem>
                      <SelectItem value="patrulheiro">Patrulheiro</SelectItem>
                      <SelectItem value="apoio">Apoio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">Observação (opcional)</label>
                <Textarea 
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Adicione uma observação..."
                  rows={2}
                />
              </div>

              <Button 
                onClick={handleStartPonto} 
                disabled={startPonto.isPending || !selectedViatura}
                className="w-full gap-2"
                size="lg"
              >
                {startPonto.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                Iniciar Turno
              </Button>
            </div>
          )}

          {/* History */}
          <div className="bg-card rounded-2xl shadow-neon border border-border/50 overflow-hidden">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-display text-lg font-bold">Histórico de Pontos</h2>
            </div>
            
            {loadingPontos ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : userPontos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum ponto registrado ainda.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {userPontos.map((ponto) => (
                  <div key={ponto.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(ponto.data_inicio).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(ponto.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            {ponto.data_fim && ` - ${new Date(ponto.data_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {ponto.tempo_total_segundos != null && (
                          <p className="font-mono font-semibold">
                            {formatDuration(ponto.tempo_total_segundos)}
                          </p>
                        )}
                        {getStatusBadge(ponto.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PontoEletronico;
