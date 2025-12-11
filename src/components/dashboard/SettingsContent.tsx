import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Image, FileText, Info, Upload } from "lucide-react";
import { useGallery, useCreateGalleryImage, useDeleteGalleryImage } from "@/hooks/useGallery";
import { useRegulamentos, useCreateRegulamento, useDeleteRegulamento } from "@/hooks/useRegulamentos";
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
  const deleteRegulamento = useDeleteRegulamento();

  // Site settings hooks
  const { data: aboutSettings, isLoading: aboutLoading } = useSiteSettings("about_page");
  const updateSiteSettings = useUpdateSiteSettings();

  // New regulamento state
  const [newRegulamento, setNewRegulamento] = useState({ titulo: "", descricao: "", categoria: "", documento_url: "" });

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
                <div key={reg.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div><p className="font-medium">{reg.titulo}</p><p className="text-sm text-muted-foreground">{reg.categoria}</p></div>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteRegulamento.mutateAsync(reg.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sobre Section */}
      {activeSection === "sobre" && (
        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50 space-y-4">
          <h3 className="font-display text-lg font-bold">Página Sobre</h3>
          {aboutLoading ? (
            <div className="py-4 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Título</Label><Input value={currentSettings.title} onChange={(e) => setEditedSettings({ ...currentSettings, title: e.target.value })} /></div>
                <div><Label>Subtítulo</Label><Input value={currentSettings.subtitle} onChange={(e) => setEditedSettings({ ...currentSettings, subtitle: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Título da Missão</Label><Input value={currentSettings.mission_title} onChange={(e) => setEditedSettings({ ...currentSettings, mission_title: e.target.value })} /></div>
                <div><Label>Título da Visão</Label><Input value={currentSettings.vision_title} onChange={(e) => setEditedSettings({ ...currentSettings, vision_title: e.target.value })} /></div>
              </div>
              <div><Label>Texto da Missão</Label><Textarea value={currentSettings.mission_text} onChange={(e) => setEditedSettings({ ...currentSettings, mission_text: e.target.value })} /></div>
              <div><Label>Texto da Visão</Label><Textarea value={currentSettings.vision_text} onChange={(e) => setEditedSettings({ ...currentSettings, vision_text: e.target.value })} /></div>
              {editedSettings && (
                <Button onClick={handleSaveAbout} disabled={updateSiteSettings.isPending}>
                  {updateSiteSettings.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Salvar Alterações
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
