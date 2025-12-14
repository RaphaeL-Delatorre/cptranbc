import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Image, FileText, Info, Upload, Edit2, Save, X } from "lucide-react";
import { useGallery, useCreateGalleryImage, useDeleteGalleryImage } from "@/hooks/useGallery";
import { useRegulamentos, useCreateRegulamento, useUpdateRegulamento, useDeleteRegulamento } from "@/hooks/useRegulamentos";
import { useSiteSettings, useUpdateSiteSettings, AboutPageSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export const SettingsContent = () => {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<"gallery" | "regulamentos" | "sobre">("gallery");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gallery hooks
  const { data: galleryImages = [], isLoading: galleryLoading } = useGallery();
  const createGalleryImage = useCreateGalleryImage();
  const deleteGalleryImage = useDeleteGalleryImage();

  // Regulamentos hooks
  const { data: regulamentos = [], isLoading: regulamentosLoading } = useRegulamentos();
  const createRegulamento = useCreateRegulamento();
  const updateRegulamento = useUpdateRegulamento();
  const deleteRegulamento = useDeleteRegulamento();

  // Site settings hooks
  const { data: aboutSettings, isLoading: aboutLoading } = useSiteSettings("about_page");
  const updateSiteSettings = useUpdateSiteSettings();

  // New regulamento state
  const [newRegulamento, setNewRegulamento] = useState({ titulo: "", descricao: "", categoria: "", documento_url: "" });
  
  // Edit regulamento state
  const [editingRegulamento, setEditingRegulamento] = useState<string | null>(null);
  const [editRegulamentoData, setEditRegulamentoData] = useState({ titulo: "", descricao: "", categoria: "", documento_url: "" });

  // About page state
  const settings: AboutPageSettings = aboutSettings?.value
    ? (aboutSettings.value as unknown as AboutPageSettings)
    : { title: "", subtitle: "", mission_title: "", mission_text: "", vision_title: "", vision_text: "", values: [], areas: [] };

  const [editedSettings, setEditedSettings] = useState<AboutPageSettings | null>(null);
  const currentSettings = editedSettings || settings;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `gallery-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from("site-images").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage.from("site-images").getPublicUrl(fileName);
      
      await createGalleryImage.mutateAsync({ image_url: publicUrl.publicUrl, display_order: galleryImages.length });
      toast({ title: "Sucesso", description: "Imagem adicionada à galeria." });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao fazer upload da imagem.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddRegulamento = async () => {
    if (!newRegulamento.titulo) {
      toast({ title: "Erro", description: "Informe o título do regulamento.", variant: "destructive" });
      return;
    }
    try {
      await createRegulamento.mutateAsync(newRegulamento);
      toast({ title: "Sucesso", description: "Regulamento adicionado." });
      setNewRegulamento({ titulo: "", descricao: "", categoria: "", documento_url: "" });
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao adicionar regulamento.", variant: "destructive" });
    }
  };

  const handleStartEditRegulamento = (reg: typeof regulamentos[0]) => {
    setEditingRegulamento(reg.id);
    setEditRegulamentoData({
      titulo: reg.titulo,
      descricao: reg.descricao || "",
      categoria: reg.categoria || "",
      documento_url: reg.documento_url || ""
    });
  };

  const handleSaveEditRegulamento = async () => {
    if (!editingRegulamento || !editRegulamentoData.titulo) {
      toast({ title: "Erro", description: "Informe o título do regulamento.", variant: "destructive" });
      return;
    }
    try {
      await updateRegulamento.mutateAsync({ id: editingRegulamento, ...editRegulamentoData });
      toast({ title: "Sucesso", description: "Regulamento atualizado." });
      setEditingRegulamento(null);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao atualizar regulamento.", variant: "destructive" });
    }
  };

  const handleSaveAbout = async () => {
    if (!editedSettings) return;
    try {
      await updateSiteSettings.mutateAsync({ key: "about_page", value: editedSettings as unknown as Json });
      toast({ title: "Sucesso", description: "Página Sobre atualizada." });
      setEditedSettings(null);
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao salvar configurações.", variant: "destructive" });
    }
  };

  // Values management
  const addValue = () => {
    const newValues = [...currentSettings.values, { title: "", description: "" }];
    setEditedSettings({ ...currentSettings, values: newValues });
  };

  const updateValue = (index: number, field: "title" | "description", value: string) => {
    const newValues = [...currentSettings.values];
    newValues[index] = { ...newValues[index], [field]: value };
    setEditedSettings({ ...currentSettings, values: newValues });
  };

  const removeValue = (index: number) => {
    const newValues = currentSettings.values.filter((_, i) => i !== index);
    setEditedSettings({ ...currentSettings, values: newValues });
  };

  // Areas management
  const addArea = () => {
    const newAreas = [...currentSettings.areas, { title: "", description: "" }];
    setEditedSettings({ ...currentSettings, areas: newAreas });
  };

  const updateArea = (index: number, field: "title" | "description", value: string) => {
    const newAreas = [...currentSettings.areas];
    newAreas[index] = { ...newAreas[index], [field]: value };
    setEditedSettings({ ...currentSettings, areas: newAreas });
  };

  const removeArea = (index: number) => {
    const newAreas = currentSettings.areas.filter((_, i) => i !== index);
    setEditedSettings({ ...currentSettings, areas: newAreas });
  };

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Configurações do Site</h2>

      {/* Section Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button variant={activeSection === "gallery" ? "default" : "outline"} onClick={() => setActiveSection("gallery")} className="gap-2">
          <Image className="h-4 w-4" /> Galeria
        </Button>
        <Button variant={activeSection === "regulamentos" ? "default" : "outline"} onClick={() => setActiveSection("regulamentos")} className="gap-2">
          <FileText className="h-4 w-4" /> Regulamentos
        </Button>
        <Button variant={activeSection === "sobre" ? "default" : "outline"} onClick={() => setActiveSection("sobre")} className="gap-2">
          <Info className="h-4 w-4" /> Sobre
        </Button>
      </div>

      {/* Gallery Section */}
      {activeSection === "gallery" && (
        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Galeria de Imagens</h3>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Adicionar Imagem
              </Button>
            </div>
          </div>
          {galleryLoading ? (
            <div className="py-8 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : galleryImages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma imagem na galeria.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {galleryImages.map((img) => (
                <div key={img.id} className="relative group aspect-video rounded-lg overflow-hidden border">
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  <Button size="icon" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteGalleryImage.mutateAsync(img.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Regulamentos Section */}
      {activeSection === "regulamentos" && (
        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-4">
          <h3 className="font-display text-lg font-bold">Regulamentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div><Label>Título *</Label><Input value={newRegulamento.titulo} onChange={(e) => setNewRegulamento({ ...newRegulamento, titulo: e.target.value })} /></div>
            <div><Label>Categoria</Label><Input value={newRegulamento.categoria} onChange={(e) => setNewRegulamento({ ...newRegulamento, categoria: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={newRegulamento.descricao} onChange={(e) => setNewRegulamento({ ...newRegulamento, descricao: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>URL do Documento</Label><Input value={newRegulamento.documento_url} onChange={(e) => setNewRegulamento({ ...newRegulamento, documento_url: e.target.value })} /></div>
            <Button onClick={handleAddRegulamento} disabled={createRegulamento.isPending}><Plus className="h-4 w-4 mr-2" />Adicionar</Button>
          </div>
          {regulamentosLoading ? (
            <div className="py-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : (
            <div className="space-y-2">
              {regulamentos.map((reg) => (
                <div key={reg.id} className="p-3 bg-muted/30 rounded-lg">
                  {editingRegulamento === reg.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div><Label>Título *</Label><Input value={editRegulamentoData.titulo} onChange={(e) => setEditRegulamentoData({ ...editRegulamentoData, titulo: e.target.value })} /></div>
                        <div><Label>Categoria</Label><Input value={editRegulamentoData.categoria} onChange={(e) => setEditRegulamentoData({ ...editRegulamentoData, categoria: e.target.value })} /></div>
                      </div>
                      <div><Label>Descrição</Label><Textarea value={editRegulamentoData.descricao} onChange={(e) => setEditRegulamentoData({ ...editRegulamentoData, descricao: e.target.value })} /></div>
                      <div><Label>URL do Documento</Label><Input value={editRegulamentoData.documento_url} onChange={(e) => setEditRegulamentoData({ ...editRegulamentoData, documento_url: e.target.value })} /></div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEditRegulamento} disabled={updateRegulamento.isPending}><Save className="h-4 w-4 mr-1" />Salvar</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingRegulamento(null)}><X className="h-4 w-4 mr-1" />Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div><p className="font-medium">{reg.titulo}</p><p className="text-sm text-muted-foreground">{reg.categoria}</p></div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleStartEditRegulamento(reg)}><Edit2 className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteRegulamento.mutateAsync(reg.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sobre Section - Expanded */}
      {activeSection === "sobre" && (
        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-6">
          <h3 className="font-display text-lg font-bold">Página Sobre</h3>
          {aboutLoading ? (
            <div className="py-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : (
            <div className="space-y-6">
              {/* Title and Subtitle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Título</Label><Input value={currentSettings.title} onChange={(e) => setEditedSettings({ ...currentSettings, title: e.target.value })} /></div>
                <div><Label>Subtítulo</Label><Input value={currentSettings.subtitle} onChange={(e) => setEditedSettings({ ...currentSettings, subtitle: e.target.value })} /></div>
              </div>

              {/* Mission */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <h4 className="font-semibold">Missão</h4>
                <div><Label>Título da Missão</Label><Input value={currentSettings.mission_title} onChange={(e) => setEditedSettings({ ...currentSettings, mission_title: e.target.value })} /></div>
                <div><Label>Texto da Missão</Label><Textarea value={currentSettings.mission_text} onChange={(e) => setEditedSettings({ ...currentSettings, mission_text: e.target.value })} /></div>
              </div>

              {/* Vision */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <h4 className="font-semibold">Visão</h4>
                <div><Label>Título da Visão</Label><Input value={currentSettings.vision_title} onChange={(e) => setEditedSettings({ ...currentSettings, vision_title: e.target.value })} /></div>
                <div><Label>Texto da Visão</Label><Textarea value={currentSettings.vision_text} onChange={(e) => setEditedSettings({ ...currentSettings, vision_text: e.target.value })} /></div>
              </div>

              {/* Values */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Valores</h4>
                  <Button size="sm" variant="outline" onClick={addValue}><Plus className="h-4 w-4 mr-1" />Adicionar Valor</Button>
                </div>
                {currentSettings.values.map((val, idx) => (
                  <div key={idx} className="p-3 bg-background rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Valor {idx + 1}</Label>
                      <Button size="icon" variant="ghost" className="text-destructive h-6 w-6" onClick={() => removeValue(idx)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <Input placeholder="Título" value={val.title} onChange={(e) => updateValue(idx, "title", e.target.value)} />
                    <Textarea placeholder="Descrição" value={val.description} onChange={(e) => updateValue(idx, "description", e.target.value)} />
                  </div>
                ))}
              </div>

              {/* Areas */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Áreas de Atuação</h4>
                  <Button size="sm" variant="outline" onClick={addArea}><Plus className="h-4 w-4 mr-1" />Adicionar Área</Button>
                </div>
                {currentSettings.areas.map((area, idx) => (
                  <div key={idx} className="p-3 bg-background rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Área {idx + 1}</Label>
                      <Button size="icon" variant="ghost" className="text-destructive h-6 w-6" onClick={() => removeArea(idx)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <Input placeholder="Título" value={area.title} onChange={(e) => updateArea(idx, "title", e.target.value)} />
                    <Textarea placeholder="Descrição" value={area.description} onChange={(e) => updateArea(idx, "description", e.target.value)} />
                  </div>
                ))}
              </div>

              {editedSettings && (
                <Button onClick={handleSaveAbout} disabled={updateSiteSettings.isPending} className="w-full">
                  {updateSiteSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar Todas as Alterações
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};