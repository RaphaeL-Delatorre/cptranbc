import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ChevronLeft, Send, User, Car, FileText, Scale, Camera, Loader2, X, Upload, Clock, LogIn } from "lucide-react";
import { useCreateAIT } from "@/hooks/useAITs";
import { useAuth } from "@/hooks/useAuth";
import { patentes, artigos, providencias, prefixosViaturas } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

const initialFormData = {
  // Step 1 - Identificação do Policial
  graduacao: "",
  nomeAgente: "",
  // Step 2 - Equipe e Viatura
  prefixo: "",
  hasEncarregado: false,
  hasTerceiroHomem: false,
  hasQuartoHomem: false,
  primeiroHomem: "",
  primeiroHomemPatente: "",
  segundoHomem: "",
  segundoHomemPatente: "",
  terceiroHomem: "",
  terceiroHomemPatente: "",
  quartoHomem: "",
  quartoHomemPatente: "",
  // Step 3 - Imagens e Relatório
  imagensAutuacao: [] as File[],
  relatorio: "",
  dataOcorrencia: "",
  // Step 4 - Dados do Condutor/Proprietário
  hasMotorista: true,
  hasProprietario: false,
  nomeCondutor: "",
  passaporteCondutor: "",
  nomeProprietario: "",
  passaporteProprietario: "",
  emplacamento: "",
  marcaModelo: "",
  // Step 5 - Artigos e Providências
  artigosInfringidos: [] as string[],
  providenciasTomadas: [] as string[]
};

const AIT = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, loading: authLoading } = useAuth();
  const createAIT = useCreateAIT();
  const totalSteps = 5;

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
              Para criar um Auto de Infração de Trânsito (AIT), é necessário estar conectado em uma conta.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate("/auth")} className="w-full">
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
  
  const handleInputChange = (field: string, value: string | string[] | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentValues = prev[field as keyof typeof prev] as string[];
      if (checked) {
        return {
          ...prev,
          [field]: [...currentValues, value]
        };
      } else {
        return {
          ...prev,
          [field]: currentValues.filter(v => v !== value)
        };
      }
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 10 - formData.imagensAutuacao.length);
    setFormData(prev => ({
      ...prev,
      imagensAutuacao: [...prev.imagensAutuacao, ...newFiles]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imagensAutuacao: prev.imagensAutuacao.filter((_, i) => i !== index)
    }));
  };

  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const file of formData.imagensAutuacao) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error } = await supabase.storage.from("ait-images").upload(filePath, file);
      if (error) {
        console.error("Error uploading image:", error);
        continue;
      }
      const { data: publicUrl } = supabase.storage.from("ait-images").getPublicUrl(filePath);
      uploadedUrls.push(publicUrl.publicUrl);
    }
    return uploadedUrls;
  };

  // Validation helper: check if name has at least 2 words (name + surname)
  const hasNameAndSurname = (name: string) => {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2 && parts.every(p => p.length > 0);
  };

  // Validation for each step
  const validateStep = (step: number): { valid: boolean; message: string } => {
    switch (step) {
      case 1:
        if (!formData.graduacao) return { valid: false, message: "Selecione sua graduação" };
        if (!hasNameAndSurname(formData.nomeAgente)) return { valid: false, message: "Informe seu nome e sobrenome" };
        return { valid: true, message: "" };
      
      case 2:
        if (!formData.prefixo) return { valid: false, message: "Selecione a viatura/prefixo" };
        if (!formData.primeiroHomemPatente) return { valid: false, message: "Selecione a patente do Motorista" };
        if (!hasNameAndSurname(formData.primeiroHomem)) return { valid: false, message: "Informe nome e sobrenome do Motorista" };
        if (formData.hasEncarregado) {
          if (!formData.segundoHomemPatente) return { valid: false, message: "Selecione a patente do Encarregado" };
          if (!hasNameAndSurname(formData.segundoHomem)) return { valid: false, message: "Informe nome e sobrenome do Encarregado" };
        }
        if (formData.hasTerceiroHomem) {
          if (!formData.terceiroHomemPatente) return { valid: false, message: "Selecione a patente do 3º Homem" };
          if (!hasNameAndSurname(formData.terceiroHomem)) return { valid: false, message: "Informe nome e sobrenome do 3º Homem" };
        }
        if (formData.hasQuartoHomem) {
          if (!formData.quartoHomemPatente) return { valid: false, message: "Selecione a patente do 4º Homem" };
          if (!hasNameAndSurname(formData.quartoHomem)) return { valid: false, message: "Informe nome e sobrenome do 4º Homem" };
        }
        return { valid: true, message: "" };
      
      case 3:
        if (!formData.dataOcorrencia) return { valid: false, message: "Informe a data da ocorrência" };
        return { valid: true, message: "" };
      
      case 4:
        const hasCondutor = formData.hasMotorista && formData.nomeCondutor.trim() && formData.passaporteCondutor.trim();
        const hasProprietario = formData.hasProprietario && formData.nomeProprietario.trim() && formData.passaporteProprietario.trim();
        const hasVeiculo = formData.emplacamento.trim() && formData.marcaModelo.trim();
        
        if (!hasVeiculo) return { valid: false, message: "Informe os dados do veículo (emplacamento e marca/modelo)" };
        if (!hasCondutor && !hasProprietario) return { valid: false, message: "Informe os dados do motorista ou do proprietário" };
        if (formData.hasMotorista && (!formData.nomeCondutor.trim() || !formData.passaporteCondutor.trim())) {
          return { valid: false, message: "Preencha os dados completos do motorista" };
        }
        if (formData.hasProprietario && (!formData.nomeProprietario.trim() || !formData.passaporteProprietario.trim())) {
          return { valid: false, message: "Preencha os dados completos do proprietário" };
        }
        
        return { valid: true, message: "" };
      
      case 5:
        if (formData.artigosInfringidos.length === 0) return { valid: false, message: "Selecione pelo menos 1 artigo infringido" };
        if (formData.providenciasTomadas.length === 0) return { valid: false, message: "Selecione pelo menos 1 providência tomada" };
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

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);

      const imageUrls = await uploadImages();

      const dataInicio = formData.dataOcorrencia ? `${formData.dataOcorrencia}T00:00:00` : undefined;

        await createAIT.mutateAsync({
          graduacao: formData.graduacao,
          nome_agente: formData.nomeAgente,
          primeiro_homem: formData.primeiroHomem,
          primeiro_homem_patente: formData.primeiroHomemPatente || undefined,
          segundo_homem: formData.hasEncarregado ? formData.segundoHomem : undefined,
          segundo_homem_patente: formData.hasEncarregado ? formData.segundoHomemPatente : undefined,
          terceiro_homem: formData.hasTerceiroHomem ? formData.terceiroHomem : undefined,
          terceiro_homem_patente: formData.hasTerceiroHomem ? formData.terceiroHomemPatente : undefined,
          quarto_homem: formData.hasQuartoHomem ? formData.quartoHomem : undefined,
          quarto_homem_patente: formData.hasQuartoHomem ? formData.quartoHomemPatente : undefined,
          viatura: formData.prefixo,
          relatorio: formData.relatorio,
          nome_condutor: formData.hasMotorista ? formData.nomeCondutor : "",
          passaporte_condutor: formData.hasMotorista ? formData.passaporteCondutor : "",
          nome_proprietario: formData.hasProprietario ? formData.nomeProprietario : undefined,
          passaporte_proprietario: formData.hasProprietario ? formData.passaporteProprietario : undefined,
          emplacamento: formData.emplacamento,
          marca_modelo: formData.marcaModelo,
          artigos_infringidos: formData.artigosInfringidos,
          providencias_tomadas: formData.providenciasTomadas,
          data_inicio: dataInicio,
          imagens: imageUrls
        });

      toast({
        title: "AIT Enviado!",
        description: "Seu Auto de Infração foi enviado e está aguardando aprovação."
      });
      resetForm();
    } catch (error) {
      console.error("Error submitting AIT:", error);
      toast({
        title: "Erro ao enviar AIT",
        description: "Ocorreu um erro ao enviar o AIT. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold">Identificação do Policial Responsável pelo AIT</h3>
                  <p className="text-sm text-muted-foreground">Informe seus dados</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate("/dashboard")} 
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Meus AITs
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="graduacao">Sua Graduação</Label>
                <Select value={formData.graduacao} onValueChange={v => handleInputChange("graduacao", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione sua graduação" />
                  </SelectTrigger>
                  <SelectContent>
                    {patentes.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nomeAgente">Nome e Sobrenome</Label>
                <Input id="nomeAgente" value={formData.nomeAgente} onChange={e => handleInputChange("nomeAgente", e.target.value)} placeholder="Digite seu nome completo" />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Equipe e Viatura</h3>
                <p className="text-sm text-muted-foreground">Informe os dados da equipe</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Viatura/Prefixo */}
              <div className="p-4 bg-primary/5 rounded-xl space-y-3 border-2 border-primary/20">
                <h4 className="font-semibold text-base text-primary">Viatura</h4>
                <div>
                  <Label>Prefixo da Viatura *</Label>
                  <Select value={formData.prefixo} onValueChange={v => handleInputChange("prefixo", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o prefixo" />
                    </SelectTrigger>
                    <SelectContent>
                      {prefixosViaturas.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Team Checkboxes */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Membros da Equipe (marque os presentes)</h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2 opacity-50">
                    <Checkbox id="hasMotorista" checked disabled />
                    <Label htmlFor="hasMotorista" className="cursor-not-allowed">Motorista (obrigatório)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasEncarregado" 
                      checked={formData.hasEncarregado}
                      onCheckedChange={(checked) => handleInputChange("hasEncarregado", checked as boolean)}
                    />
                    <Label htmlFor="hasEncarregado" className="cursor-pointer">Encarregado</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasTerceiroHomem" 
                      checked={formData.hasTerceiroHomem}
                      onCheckedChange={(checked) => handleInputChange("hasTerceiroHomem", checked as boolean)}
                    />
                    <Label htmlFor="hasTerceiroHomem" className="cursor-pointer">3º Homem</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasQuartoHomem" 
                      checked={formData.hasQuartoHomem}
                      onCheckedChange={(checked) => handleInputChange("hasQuartoHomem", checked as boolean)}
                    />
                    <Label htmlFor="hasQuartoHomem" className="cursor-pointer">4º Homem</Label>
                  </div>
                </div>
              </div>

              {/* Motorista (sempre visível) */}
              <div className="p-4 bg-primary/10 rounded-xl space-y-3 border-2 border-primary/30">
                <h5 className="font-semibold text-sm text-primary">Motorista *</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>Patente *</Label>
                    <Select value={formData.primeiroHomemPatente} onValueChange={v => handleInputChange("primeiroHomemPatente", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {patentes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="primeiroHomem">Nome *</Label>
                    <Input id="primeiroHomem" value={formData.primeiroHomem} onChange={e => handleInputChange("primeiroHomem", e.target.value)} placeholder="Nome do motorista" />
                  </div>
                </div>
              </div>

              {/* Encarregado (condicional) */}
              {formData.hasEncarregado && (
                <div className="p-4 bg-muted/50 rounded-xl space-y-3 animate-fade-in">
                  <h5 className="font-semibold text-sm text-muted-foreground">Encarregado</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Patente *</Label>
                      <Select value={formData.segundoHomemPatente} onValueChange={v => handleInputChange("segundoHomemPatente", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {patentes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="segundoHomem">Nome *</Label>
                      <Input id="segundoHomem" value={formData.segundoHomem} onChange={e => handleInputChange("segundoHomem", e.target.value)} placeholder="Nome do encarregado" />
                    </div>
                  </div>
                </div>
              )}

              {/* 3º Homem (condicional) */}
              {formData.hasTerceiroHomem && (
                <div className="p-4 bg-muted/50 rounded-xl space-y-3 animate-fade-in">
                  <h5 className="font-semibold text-sm text-muted-foreground">3º Homem</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Patente *</Label>
                      <Select value={formData.terceiroHomemPatente} onValueChange={v => handleInputChange("terceiroHomemPatente", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {patentes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="terceiroHomem">Nome *</Label>
                      <Input id="terceiroHomem" value={formData.terceiroHomem} onChange={e => handleInputChange("terceiroHomem", e.target.value)} placeholder="Nome do 3º homem" />
                    </div>
                  </div>
                </div>
              )}

              {/* 4º Homem (condicional) */}
              {formData.hasQuartoHomem && (
                <div className="p-4 bg-muted/50 rounded-xl space-y-3 animate-fade-in">
                  <h5 className="font-semibold text-sm text-muted-foreground">4º Homem</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Patente *</Label>
                      <Select value={formData.quartoHomemPatente} onValueChange={v => handleInputChange("quartoHomemPatente", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {patentes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="quartoHomem">Nome *</Label>
                      <Input id="quartoHomem" value={formData.quartoHomem} onChange={e => handleInputChange("quartoHomem", e.target.value)} placeholder="Nome do 4º homem" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Imagens, Data e Relatório</h3>
                <p className="text-sm text-muted-foreground">Documentação da autuação</p>
              </div>
            </div>

            {/* Date Section */}
            <div className="p-4 bg-primary/5 rounded-xl space-y-4 border-2 border-primary/20">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-base text-primary">Data da Ocorrência</h4>
              </div>
              
              <div>
                <Label>Data *</Label>
                <Input 
                  type="date" 
                  value={formData.dataOcorrencia} 
                  onChange={e => handleInputChange("dataOcorrencia", e.target.value)} 
                  className="max-w-xs"
                />
              </div>
            </div>

            {/* Images Section */}
            <div>
              <Label>Imagens da Autuação</Label>
              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" multiple className="hidden" />
              <div className="mt-2 border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Clique para adicionar imagens ou arraste os arquivos aqui
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.imagensAutuacao.length}/10 imagens selecionadas
                </p>
              </div>

              {formData.imagensAutuacao.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {formData.imagensAutuacao.map((file, index) => (
                    <div key={index} className="relative group">
                      <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg border border-border" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="relatorio">Relatório</Label>
              <Textarea id="relatorio" value={formData.relatorio} onChange={e => handleInputChange("relatorio", e.target.value)} placeholder="Descreva detalhadamente a ocorrência..." className="min-h-[150px]" />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Dados do Motorista, Proprietário e Veículo</h3>
                <p className="text-sm text-muted-foreground">Informe os dados do condutor e/ou proprietário</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Checkboxes for Motorista/Proprietário */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Envolvidos (marque os presentes)</h4>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasMotorista" 
                      checked={formData.hasMotorista}
                      onCheckedChange={(checked) => handleInputChange("hasMotorista", checked as boolean)}
                    />
                    <Label htmlFor="hasMotorista" className="cursor-pointer">Motorista</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasProprietario" 
                      checked={formData.hasProprietario}
                      onCheckedChange={(checked) => handleInputChange("hasProprietario", checked as boolean)}
                    />
                    <Label htmlFor="hasProprietario" className="cursor-pointer">Proprietário</Label>
                  </div>
                </div>
              </div>

              {/* Motorista (condicional) */}
              {formData.hasMotorista && (
                <div className="p-4 bg-primary/10 rounded-xl space-y-3 border-2 border-primary/30 animate-fade-in">
                  <h5 className="font-semibold text-sm text-primary">Motorista do Veículo *</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="nomeCondutor">Nome do Motorista *</Label>
                      <Input id="nomeCondutor" value={formData.nomeCondutor} onChange={e => handleInputChange("nomeCondutor", e.target.value)} placeholder="Nome completo" />
                    </div>
                    <div>
                      <Label htmlFor="passaporteCondutor">Passaporte do Motorista *</Label>
                      <Input id="passaporteCondutor" value={formData.passaporteCondutor} onChange={e => handleInputChange("passaporteCondutor", e.target.value)} placeholder="Número do passaporte" />
                    </div>
                  </div>
                </div>
              )}

              {/* Proprietário (condicional) */}
              {formData.hasProprietario && (
                <div className="p-4 bg-muted/50 rounded-xl space-y-3 animate-fade-in">
                  <h5 className="font-semibold text-sm text-muted-foreground">Proprietário do Veículo *</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="nomeProprietario">Nome do Proprietário *</Label>
                      <Input id="nomeProprietario" value={formData.nomeProprietario} onChange={e => handleInputChange("nomeProprietario", e.target.value)} placeholder="Nome completo" />
                    </div>
                    <div>
                      <Label htmlFor="passaporteProprietario">Passaporte do Proprietário *</Label>
                      <Input id="passaporteProprietario" value={formData.passaporteProprietario} onChange={e => handleInputChange("passaporteProprietario", e.target.value)} placeholder="Número do passaporte" />
                    </div>
                  </div>
                </div>
              )}

              {/* Veículo */}
              <div className="p-4 bg-primary/5 rounded-xl space-y-3 border-2 border-primary/20">
                <h5 className="font-semibold text-sm text-primary">Veículo *</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="emplacamento">Emplacamento *</Label>
                    <Input id="emplacamento" value={formData.emplacamento} onChange={e => handleInputChange("emplacamento", e.target.value.toUpperCase())} placeholder="XXX-0000" />
                  </div>
                  <div>
                    <Label htmlFor="marcaModelo">Marca/Modelo *</Label>
                    <Input id="marcaModelo" value={formData.marcaModelo} onChange={e => handleInputChange("marcaModelo", e.target.value)} placeholder="Ex: Fiat Uno" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Artigos Infringidos e Providências</h3>
                <p className="text-sm text-muted-foreground">Selecione as infrações e providências</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-3 block">Artigos Infringidos *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {artigos.map(art => (
                    <div key={art} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={`art-${art}`}
                        checked={formData.artigosInfringidos.includes(art)}
                        onCheckedChange={(checked) => handleCheckboxChange("artigosInfringidos", art, checked as boolean)}
                      />
                      <Label htmlFor={`art-${art}`} className="cursor-pointer text-sm">{art}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">Providências Tomadas *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {providencias.map(prov => (
                    <div key={prov} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={`prov-${prov}`}
                        checked={formData.providenciasTomadas.includes(prov)}
                        onCheckedChange={(checked) => handleCheckboxChange("providenciasTomadas", prov, checked as boolean)}
                      />
                      <Label htmlFor={`prov-${prov}`} className="cursor-pointer text-sm">{prov}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepIcons = [
    { icon: User, label: "Policial" },
    { icon: Car, label: "Equipe" },
    { icon: Camera, label: "Dados" },
    { icon: FileText, label: "Veículo" },
    { icon: Scale, label: "Artigos" }
  ];

  return (
    <MainLayout>
      <div className="min-h-[80vh] py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">
              Auto de Infração de Trânsito
            </h1>
            <p className="text-muted-foreground">
              Preencha todas as informações corretamente
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between items-center mb-8 max-w-2xl mx-auto">
            {stepIcons.map((step, index) => {
              const Icon = step.icon;
              const stepNum = index + 1;
              const isActive = currentStep === stepNum;
              const isCompleted = currentStep > stepNum;

              return (
                <div key={stepNum} className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : isCompleted
                      ? "bg-success text-success-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border/50">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {currentStep < totalSteps ? (
                <Button onClick={nextStep} className="gap-2">
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={uploading || createAIT.isPending}
                  className="gap-2"
                >
                  {(uploading || createAIT.isPending) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar AIT
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AIT;