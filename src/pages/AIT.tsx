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
import { patentes, artigos, providencias, viaturas, prefixosPorViatura } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
const initialFormData = {
  // Step 1 - Identificação do Agente
  graduacao: "",
  nomeAgente: "",
  // Step 2 - Equipe e Viatura
  viatura: "",
  prefixo: "",
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
  dataInicio: "",
  horaInicio: "",
  dataTermino: "",
  horaTermino: "",
  // Step 4 - Dados do Condutor/Proprietário
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
  const {
    toast
  } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    user,
    loading: authLoading
  } = useAuth();
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
  
  // Get available prefixos based on selected viatura
  const availablePrefixos = formData.viatura ? prefixosPorViatura[formData.viatura] || [] : [];
  
  const handleInputChange = (field: string, value: string | string[]) => {
    // Clear prefixo when viatura changes
    if (field === "viatura") {
      setFormData(prev => ({ ...prev, viatura: value as string, prefixo: "" }));
      return;
    }
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
      const {
        error
      } = await supabase.storage.from("ait-images").upload(filePath, file);
      if (error) {
        console.error("Error uploading image:", error);
        continue;
      }
      const {
        data: publicUrl
      } = supabase.storage.from("ait-images").getPublicUrl(filePath);
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
        if (!formData.viatura) return { valid: false, message: "Selecione a viatura" };
        if (!formData.prefixo) return { valid: false, message: "Selecione o prefixo" };
        if (!formData.primeiroHomemPatente) return { valid: false, message: "Selecione a patente do 1º Homem" };
        if (!hasNameAndSurname(formData.primeiroHomem)) return { valid: false, message: "Informe nome e sobrenome do 1º Homem" };
        if (!formData.segundoHomemPatente) return { valid: false, message: "Selecione a patente do 2º Homem" };
        if (!hasNameAndSurname(formData.segundoHomem)) return { valid: false, message: "Informe nome e sobrenome do 2º Homem" };
        return { valid: true, message: "" };
      
      case 3:
        if (!formData.dataInicio || !formData.horaInicio) return { valid: false, message: "Informe a data e hora de início" };
        if (!formData.dataTermino || !formData.horaTermino) return { valid: false, message: "Informe a data e hora de término" };
        
        // Build datetime objects for comparison
        const startDateTime = new Date(`${formData.dataInicio}T${formData.horaInicio}`);
        let endDateTime = new Date(`${formData.dataTermino}T${formData.horaTermino}`);
        
        // If end time is before start time and dates are the same, assume midnight crossing
        if (formData.dataInicio === formData.dataTermino && endDateTime <= startDateTime) {
          // Automatically adjust end date to next day for validation
          return { valid: false, message: "O horário de término deve ser posterior ao de início. Se o patrulhamento passou da meia-noite, ajuste a data de término para o dia seguinte." };
        }
        
        if (endDateTime <= startDateTime) {
          return { valid: false, message: "O horário de término deve ser posterior ao de início" };
        }
        
        return { valid: true, message: "" };
      
      case 4:
        const hasCondutor = formData.nomeCondutor.trim() && formData.passaporteCondutor.trim();
        const hasProprietario = formData.nomeProprietario.trim() && formData.passaporteProprietario.trim();
        const hasVeiculo = formData.emplacamento.trim() && formData.marcaModelo.trim();
        
        if (!hasVeiculo) return { valid: false, message: "Informe os dados do veículo (emplacamento e marca/modelo)" };
        if (!hasCondutor && !hasProprietario) return { valid: false, message: "Informe os dados do motorista ou do proprietário" };
        
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

      // Upload images first
      const imageUrls = await uploadImages();

      // Build datetime strings
      const dataInicio = formData.dataInicio && formData.horaInicio ? `${formData.dataInicio}T${formData.horaInicio}:00` : undefined;
      const dataTermino = formData.dataTermino && formData.horaTermino ? `${formData.dataTermino}T${formData.horaTermino}:00` : undefined;
      await createAIT.mutateAsync({
        graduacao: formData.graduacao,
        nome_agente: formData.nomeAgente,
        primeiro_homem: formData.primeiroHomem,
        primeiro_homem_patente: formData.primeiroHomemPatente || undefined,
        segundo_homem: formData.segundoHomem || undefined,
        segundo_homem_patente: formData.segundoHomemPatente || undefined,
        terceiro_homem: formData.terceiroHomem || undefined,
        terceiro_homem_patente: formData.terceiroHomemPatente || undefined,
        quarto_homem: formData.quartoHomem || undefined,
        quarto_homem_patente: formData.quartoHomemPatente || undefined,
        viatura: `${formData.viatura} - ${formData.prefixo}`,
        relatorio: formData.relatorio,
        nome_condutor: formData.nomeCondutor,
        passaporte_condutor: formData.passaporteCondutor,
        nome_proprietario: formData.nomeProprietario || undefined,
        passaporte_proprietario: formData.passaporteProprietario || undefined,
        emplacamento: formData.emplacamento,
        marca_modelo: formData.marcaModelo,
        artigos_infringidos: formData.artigosInfringidos,
        providencias_tomadas: formData.providenciasTomadas,
        data_inicio: dataInicio,
        data_termino: dataTermino,
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
        return <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Identificação do Policial Responsável pelo AIT</h3>
                <p className="text-sm text-muted-foreground">Informe seus dados</p>
              </div>
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
          </div>;
      case 2:
        return <div className="space-y-6 animate-fade-in">
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
              {/* Viatura e Prefixo - Side by Side */}
              <div className="p-4 bg-primary/5 rounded-xl space-y-3 border-2 border-primary/20">
                <h4 className="font-semibold text-base text-primary">Viatura</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Modelo da Unidade *</Label>
                    <Select value={formData.viatura} onValueChange={v => handleInputChange("viatura", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {viaturas.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Prefixo da Unidade *</Label>
                    <Select 
                      value={formData.prefixo} 
                      onValueChange={v => handleInputChange("prefixo", v)}
                      disabled={!formData.viatura}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o prefixo" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePrefixos.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="space-y-3">
                
                
                {/* 1º Homem */}
                <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <h5 className="font-semibold text-sm text-muted-foreground">1º Homem (Motorista)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Patente</Label>
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
                      <Label htmlFor="primeiroHomem">Nome</Label>
                      <Input id="primeiroHomem" value={formData.primeiroHomem} onChange={e => handleInputChange("primeiroHomem", e.target.value)} placeholder="Nome do motorista" />
                    </div>
                  </div>
                </div>

                {/* 2º Homem */}
                <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <h5 className="font-semibold text-sm text-muted-foreground">2º Homem (Encarregado)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Patente</Label>
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
                      <Label htmlFor="segundoHomem">Nome</Label>
                      <Input id="segundoHomem" value={formData.segundoHomem} onChange={e => handleInputChange("segundoHomem", e.target.value)} placeholder="Nome do encarregado" />
                    </div>
                  </div>
                </div>

                {/* 3º Homem */}
                <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <h5 className="font-semibold text-sm text-muted-foreground">3º Homem (Opcional)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Patente</Label>
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
                      <Label htmlFor="terceiroHomem">Nome</Label>
                      <Input id="terceiroHomem" value={formData.terceiroHomem} onChange={e => handleInputChange("terceiroHomem", e.target.value)} placeholder="Nome (opcional)" />
                    </div>
                  </div>
                </div>

                {/* 4º Homem */}
                <div className="p-4 bg-muted/50 rounded-xl space-y-3">
                  <h5 className="font-semibold text-sm text-muted-foreground">4º Homem (Opcional)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Patente</Label>
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
                      <Label htmlFor="quartoHomem">Nome</Label>
                      <Input id="quartoHomem" value={formData.quartoHomem} onChange={e => handleInputChange("quartoHomem", e.target.value)} placeholder="Nome (opcional)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>;
      case 3:
        return <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Imagens, Data/Hora e Relatório</h3>
                <p className="text-sm text-muted-foreground">Documentação da autuação</p>
              </div>
            </div>

            {/* Date/Time Section */}
            <div className="p-4 bg-primary/5 rounded-xl space-y-4 border-2 border-primary/20">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-base text-primary">Data e Hora da Ocorrência</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label className="font-semibold">Início</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Data</Label>
                      <Input type="date" value={formData.dataInicio} onChange={e => handleInputChange("dataInicio", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Hora</Label>
                      <Input type="time" value={formData.horaInicio} onChange={e => handleInputChange("horaInicio", e.target.value)} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="font-semibold">Término</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Data</Label>
                      <Input type="date" value={formData.dataTermino} onChange={e => handleInputChange("dataTermino", e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Hora</Label>
                      <Input type="time" value={formData.horaTermino} onChange={e => handleInputChange("horaTermino", e.target.value)} />
                    </div>
                  </div>
                </div>
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

              {/* Image Preview */}
              {formData.imagensAutuacao.length > 0 && <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {formData.imagensAutuacao.map((file, index) => <div key={index} className="relative group">
                      <img src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-lg border border-border" />
                      <button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4" />
                      </button>
                    </div>)}
                </div>}
            </div>

            <div>
              <Label htmlFor="relatorio">Relatório</Label>
              <Textarea id="relatorio" value={formData.relatorio} onChange={e => handleInputChange("relatorio", e.target.value)} placeholder="Descreva detalhadamente a ocorrência..." className="min-h-[150px]" />
            </div>
          </div>;
      case 4:
        return <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Dados do Veículo</h3>
                <p className="text-sm text-muted-foreground">Informações do motorista e veículo</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Motorista */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-4">
                <h4 className="font-semibold text-foreground">Dados do Motorista</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nomeCondutor">Nome do Motorista</Label>
                    <Input id="nomeCondutor" value={formData.nomeCondutor} onChange={e => handleInputChange("nomeCondutor", e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div>
                    <Label htmlFor="passaporteCondutor">Passaporte do Motorista</Label>
                    <Input id="passaporteCondutor" value={formData.passaporteCondutor} onChange={e => handleInputChange("passaporteCondutor", e.target.value)} placeholder="Número do passaporte" />
                  </div>
                </div>
              </div>

              {/* Proprietário */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-4">
                <h4 className="font-semibold text-foreground">Dados do Proprietário</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nomeProprietario">Nome do Proprietário</Label>
                    <Input id="nomeProprietario" value={formData.nomeProprietario} onChange={e => handleInputChange("nomeProprietario", e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div>
                    <Label htmlFor="passaporteProprietario">Passaporte do Proprietário</Label>
                    <Input id="passaporteProprietario" value={formData.passaporteProprietario} onChange={e => handleInputChange("passaporteProprietario", e.target.value)} placeholder="Número do passaporte" />
                  </div>
                </div>
              </div>

              {/* Veículo */}
              <div className="p-4 bg-muted/50 rounded-xl space-y-4">
                <h4 className="font-semibold text-foreground">Dados do Veículo</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emplacamento">Emplacamento</Label>
                    <Input id="emplacamento" value={formData.emplacamento} onChange={e => handleInputChange("emplacamento", e.target.value)} placeholder="Placa do veículo" />
                  </div>
                  <div>
                    <Label htmlFor="marcaModelo">Marca / Modelo do Veículo</Label>
                    <Input id="marcaModelo" value={formData.marcaModelo} onChange={e => handleInputChange("marcaModelo", e.target.value)} placeholder="Ex: Volkswagen Gol" />
                  </div>
                </div>
              </div>
            </div>
          </div>;
      case 5:
        return <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">Artigos e Providências</h3>
                <p className="text-sm text-muted-foreground">Infrações e medidas tomadas</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Artigos */}
              <div>
                <Label className="text-base font-semibold">Artigos Infringidos</Label>
                <p className="text-sm text-muted-foreground mb-3">Selecione todos os artigos aplicáveis</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-muted/50 rounded-xl max-h-[200px] overflow-y-auto">
                  {artigos.map(artigo => <div key={artigo} className="flex items-center space-x-2">
                      <Checkbox id={artigo} checked={formData.artigosInfringidos.includes(artigo)} onCheckedChange={checked => handleCheckboxChange("artigosInfringidos", artigo, checked as boolean)} />
                      <label htmlFor={artigo} className="text-sm cursor-pointer">{artigo}</label>
                    </div>)}
                </div>
              </div>

              {/* Providências */}
              <div>
                <Label className="text-base font-semibold">Providências Tomadas</Label>
                <p className="text-sm text-muted-foreground mb-3">Selecione todas as providências aplicadas</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted/50 rounded-xl">
                  {providencias.map(providencia => <div key={providencia} className="flex items-center space-x-2">
                      <Checkbox id={providencia} checked={formData.providenciasTomadas.includes(providencia)} onCheckedChange={checked => handleCheckboxChange("providenciasTomadas", providencia, checked as boolean)} />
                      <label htmlFor={providencia} className="text-sm cursor-pointer">{providencia}</label>
                    </div>)}
                </div>
              </div>
            </div>
          </div>;
      default:
        return null;
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>;
  }
  const stepNames = [
    "Informações",
    "Equipe e Viatura", 
    "Complementos",
    "Dados do Veículo",
    "Artigos e Providências"
  ];

  return <MainLayout>
      {/* Hero Section */}
      <section className="relative py-16 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-secondary-foreground mb-4">
            AIT - <span className="text-primary">Auto de Infração de Trânsito</span>
          </h1>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Progress Bar with Step Names */}
          <div className="mb-8">
            <div className="flex justify-between items-start mb-4">
              {[1, 2, 3, 4, 5].map(step => (
                <div key={step} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step === currentStep ? "bg-primary text-primary-foreground shadow-glow" : step < currentStep ? "bg-primary/80 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {step}
                  </div>
                  <span className={`text-xs text-center font-medium hidden sm:block ${step === currentStep ? "text-primary" : step < currentStep ? "text-foreground" : "text-muted-foreground"}`}>
                    {stepNames[step - 1]}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{
              width: `${(currentStep - 1) / (totalSteps - 1) * 100}%`
            }} />
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card border border-border/50">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-border/50">
              <Button variant="outline" onClick={prevStep} disabled={currentStep === 1} className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {currentStep < totalSteps ? <Button onClick={nextStep} className="gap-2">
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button> : <Button onClick={() => {
                  const validation = validateStep(5);
                  if (!validation.valid) {
                    toast({
                      title: "Campos obrigatórios",
                      description: validation.message,
                      variant: "destructive"
                    });
                    return;
                  }
                  handleSubmit();
                }} className="gap-2 bg-primary hover:bg-primary/90" disabled={createAIT.isPending || uploading}>
                  {createAIT.isPending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar AIT
                </Button>}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>;
};
export default AIT;