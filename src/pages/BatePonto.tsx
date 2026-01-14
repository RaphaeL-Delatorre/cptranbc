import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, User, Clock, Play, Pause, Square, LogIn, Loader2, Car, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePonto, usePausePonto, useResumePonto, useFinalizePonto, usePontoPendente, useMeusPontos, formatDuration, type PontoEletronico } from "@/hooks/usePontoEletronico";
import { useViaturas } from "@/hooks/useViaturas";
import { patentes, prefixosViaturas } from "@/lib/constants";

const funcoesViatura = [
  { value: "motorista", label: "Motorista" },
  { value: "encarregado", label: "Encarregado" },
  { value: "patrulheiro", label: "3° Homem" },
  { value: "apoio", label: "4° Homem" },
] as const;

const BatePonto = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showMeusPontos, setShowMeusPontos] = useState(false);
  const [formData, setFormData] = useState({
    funcao: "",
    viatura: "",
    patente: "",
    nomePolicial: "",
    pontoDiscord: "",
  });
  
  // Timer state
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Hooks
  const { data: activePonto, isLoading: pontoLoading } = usePontoPendente();
  const { data: meusPontos = [], isLoading: meusPontosLoading } = useMeusPontos();
  const { data: viaturas = [] } = useViaturas();
  const createPonto = useCreatePonto();
  const pausePonto = usePausePonto();
  const resumePonto = useResumePonto();
  const finalizePonto = useFinalizePonto();

  const totalSteps = 3;

  // Effect to check for active ponto and set step 3 if exists
  useEffect(() => {
    if (activePonto) {
      setCurrentStep(3);
      // Calculate elapsed time from data_inicio
      const startTime = new Date(activePonto.data_inicio).getTime();
      let pausedTime = 0;
      
      // Calculate total paused time
      const pausas = (activePonto.pausas as { inicio: string; fim?: string }[] | null) || [];
      for (const pausa of pausas) {
        const pauseStart = new Date(pausa.inicio).getTime();
        const pauseEnd = pausa.fim ? new Date(pausa.fim).getTime() : Date.now();
        pausedTime += pauseEnd - pauseStart;
      }
      
      const elapsed = Math.floor((Date.now() - startTime - pausedTime) / 1000);
      setElapsedTime(Math.max(0, elapsed));
    }
  }, [activePonto]);

  // Timer effect
  useEffect(() => {
    if (activePonto?.status === "ativo") {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [activePonto?.status]);

  // If not logged in, show login prompt
  if (!authLoading && !user) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8 bg-card rounded-2xl shadow-card border border-border/50">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-3">Login Necessário</h2>
            <p className="text-muted-foreground mb-6">
              Para registrar seu ponto eletrônico, é necessário estar conectado em uma conta.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/admin")} className="w-full">
                <LogIn className="h-4 w-4 mr-2" />
                Fazer Login
              </Button>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (pontoLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): { valid: boolean; message: string } => {
    switch (step) {
      case 1:
        if (!formData.funcao) return { valid: false, message: "Selecione sua função" };
        if (!formData.viatura) return { valid: false, message: "Selecione a viatura" };
        return { valid: true, message: "" };
      case 2:
        if (!formData.patente) return { valid: false, message: "Selecione sua patente" };
        if (!formData.nomePolicial.trim()) return { valid: false, message: "Informe seu nome" };
        return { valid: true, message: "" };
      default:
        return { valid: true, message: "" };
    }
  };

  const nextStep = () => {
    const validation = validateStep(currentStep);
    if (!validation.valid) {
      toast({
        title: "Campos obrigatórios",
        description: validation.message,
        variant: "destructive"
      });
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStart = async () => {
    try {
      await createPonto.mutateAsync({
        funcao: formData.funcao,
        patente: formData.patente,
        nome_policial: formData.nomePolicial,
        viatura: formData.viatura,
        ponto_discord: formData.pontoDiscord || undefined,
      });
      toast({ title: "Ponto Iniciado", description: "Seu ponto eletrônico foi iniciado com sucesso." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao iniciar ponto.", variant: "destructive" });
    }
  };

  const handlePause = async () => {
    if (!activePonto) return;
    try {
      await pausePonto.mutateAsync(activePonto.id);
      toast({ title: "Ponto Pausado", description: "Seu ponto foi pausado." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao pausar ponto.", variant: "destructive" });
    }
  };

  const handleResume = async () => {
    if (!activePonto) return;
    try {
      await resumePonto.mutateAsync(activePonto.id);
      toast({ title: "Ponto Retomado", description: "Seu ponto foi retomado." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao retomar ponto.", variant: "destructive" });
    }
  };

  const handleFinish = async () => {
    if (!activePonto) return;
    if (!confirm("Tem certeza que deseja encerrar seu ponto? Esta ação não pode ser desfeita.")) return;
    
    try {
      await finalizePonto.mutateAsync(activePonto.id);
      toast({ 
        title: "Ponto Finalizado", 
        description: "Seu ponto foi encerrado e enviado para aprovação." 
      });
      // Reset form and go back to step 1
      setFormData({
        funcao: "",
        viatura: "",
        patente: "",
        nomePolicial: "",
        pontoDiscord: "",
      });
      setElapsedTime(0);
      setCurrentStep(1);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao finalizar ponto.", variant: "destructive" });
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

  // Meus Pontos view
  if (showMeusPontos) {
    const finishedPontos = meusPontos.filter(p => ["pendente", "aprovado", "recusado"].includes(p.status));
    
    return (
      <MainLayout>
        <section className="py-16 md:py-24 min-h-screen">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-display text-3xl font-bold mb-2">Meus Pontos</h1>
                <p className="text-muted-foreground">Histórico de pontos eletrônicos</p>
              </div>
              <Button variant="outline" onClick={() => setShowMeusPontos(false)} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>

            <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
              {meusPontosLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : finishedPontos.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Você ainda não tem pontos registrados.</p>
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
                        <th className="text-left p-4 font-semibold text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {finishedPontos.map((ponto) => (
                        <tr key={ponto.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4">{new Date(ponto.data_inicio).toLocaleDateString('pt-BR')}</td>
                          <td className="p-4">{funcoesViatura.find(f => f.value === ponto.funcao)?.label || ponto.funcao}</td>
                          <td className="p-4">{ponto.viatura || "-"}</td>
                          <td className="p-4 font-mono">{formatDuration(ponto.tempo_total_segundos || 0)}</td>
                          <td className="p-4">
                            {getStatusBadge(ponto.status)}
                            {ponto.status === "recusado" && ponto.motivo_recusa && (
                              <p className="text-xs text-destructive mt-1">Motivo: {ponto.motivo_recusa}</p>
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
        </section>
      </MainLayout>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Função e Viatura</h3>
                <p className="text-sm text-muted-foreground">Selecione sua função e a viatura</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Sua Função *</Label>
                <Select value={formData.funcao} onValueChange={v => handleInputChange("funcao", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione sua função" />
                  </SelectTrigger>
                  <SelectContent>
                    {funcoesViatura.map(f => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Viatura (Prefixo) *</Label>
                <Select value={formData.viatura} onValueChange={v => handleInputChange("viatura", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a viatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {prefixosViaturas.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Identificação do Policial</h3>
                <p className="text-sm text-muted-foreground">Informe seus dados</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Patente *</Label>
                <Select value={formData.patente} onValueChange={v => handleInputChange("patente", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione sua patente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patentes.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nomePolicial">Nome/Sobrenome *</Label>
                <Input 
                  id="nomePolicial" 
                  value={formData.nomePolicial} 
                  onChange={e => handleInputChange("nomePolicial", e.target.value)} 
                  placeholder="Digite seu nome e sobrenome" 
                />
              </div>

              <div>
                <Label htmlFor="pontoDiscord">Ponto Discord (opcional)</Label>
                <Input 
                  id="pontoDiscord" 
                  value={formData.pontoDiscord} 
                  onChange={e => handleInputChange("pontoDiscord", e.target.value)} 
                  placeholder="Seu nome no Discord" 
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Ponto Eletrônico</h3>
                <p className="text-sm text-muted-foreground">Controle seu tempo de serviço</p>
              </div>
            </div>

            {/* Timer Display */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 text-center border-2 border-primary/20">
              <div className="text-6xl font-mono font-bold text-foreground mb-4">
                {formatDuration(elapsedTime)}
              </div>
              <p className="text-muted-foreground">
                {activePonto?.status === "pausado" ? "Pausado" : "Em andamento"}
              </p>
              {activePonto && (
                <p className="text-sm text-muted-foreground mt-2">
                  {activePonto.patente} {activePonto.nome_policial} - {
                    funcoesViatura.find(f => f.value === activePonto.funcao)?.label
                  }
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              {!activePonto ? (
                <Button 
                  size="lg" 
                  className="gap-2 px-8"
                  onClick={handleStart}
                  disabled={createPonto.isPending}
                >
                  {createPonto.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  Iniciar
                </Button>
              ) : (
                <>
                  {activePonto.status === "ativo" ? (
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="gap-2 px-8"
                      onClick={handlePause}
                      disabled={pausePonto.isPending}
                    >
                      {pausePonto.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Pause className="h-5 w-5" />
                      )}
                      Pausar
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      className="gap-2 px-8"
                      onClick={handleResume}
                      disabled={resumePonto.isPending}
                    >
                      {resumePonto.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                      Retomar
                    </Button>
                  )}
                  <Button 
                    size="lg" 
                    variant="destructive"
                    className="gap-2 px-8"
                    onClick={handleFinish}
                    disabled={finalizePonto.isPending}
                  >
                    {finalizePonto.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                    Encerrar
                  </Button>
                </>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepIcons = [
    { icon: Car, label: "Função" },
    { icon: User, label: "Policial" },
    { icon: Clock, label: "Ponto" },
  ];

  return (
    <MainLayout>
      <section className="py-16 md:py-24 min-h-screen flex items-center">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Bate-<span className="text-gradient">Ponto</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Registre seu ponto eletrônico
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {stepIcons.map((step, index) => {
              const StepIcon = step.icon;
              const stepNum = index + 1;
              const isActive = stepNum === currentStep;
              const isCompleted = stepNum < currentStep;

              return (
                <div key={index} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground scale-110"
                        : isCompleted
                        ? "bg-primary/80 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <StepIcon className="h-5 w-5" />
                  </div>
                  {index < stepIcons.length - 1 && (
                    <div
                      className={`w-12 h-1 mx-1 rounded transition-colors ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-8">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
              {/* Left side - Back button or Meus Pontos */}
              <div>
                {currentStep === 1 && !activePonto ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowMeusPontos(true)}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Meus Pontos
                  </Button>
                ) : currentStep > 1 && !activePonto ? (
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    className="gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                ) : activePonto ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowMeusPontos(true)}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Meus Pontos
                  </Button>
                ) : null}
              </div>

              {/* Right side - Next button */}
              <div>
                {!activePonto && currentStep < 3 && (
                  <Button onClick={nextStep} className="gap-2">
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default BatePonto;