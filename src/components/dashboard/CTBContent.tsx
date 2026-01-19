import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useRoles";
import {
  useCTBArticles,
  useCreateCTBArticle,
  useUpdateCTBArticle,
  useDeleteCTBArticle,
  type CTBArticle,
} from "@/hooks/useCTB";
import { FileText, Loader2, Plus, Search, Trash2, Edit } from "lucide-react";

const penalties = [
  { key: "multa", label: "Multa" },
  { key: "retencao", label: "Retenção" },
  { key: "remocao", label: "Remoção" },
  { key: "apreensao", label: "Apreensão" },
  { key: "revogacao", label: "Revogação" },
  { key: "prisao", label: "Prisão" },
] as const;

type PenaltyKey = (typeof penalties)[number]["key"];

type FormState = {
  categoria: string;
  artigo: string;
  descricao: string;
  multa: boolean;
  retencao: boolean;
  remocao: boolean;
  apreensao: boolean;
  revogacao: boolean;
  prisao: boolean;
};

const emptyForm: FormState = {
  categoria: "",
  artigo: "",
  descricao: "",
  multa: false,
  retencao: false,
  remocao: false,
  apreensao: false,
  revogacao: false,
  prisao: false,
};

const CTBContent = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: roles = [] } = useUserRoles(user?.id);
  const isAdmin = roles.some((r) => r.role === "admin");

  const { data: artigos = [], isLoading } = useCTBArticles();
  const createArticle = useCreateCTBArticle();
  const updateArticle = useUpdateCTBArticle();
  const deleteArticle = useDeleteCTBArticle();

  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<string>("Todas");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CTBArticle | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    artigos.forEach((a) => set.add(a.categoria));
    return ["Todas", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [artigos]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return artigos.filter((a) => {
      if (categoria !== "Todas" && a.categoria !== categoria) return false;
      if (!term) return true;
      const hay = `${a.categoria} ${a.artigo} ${a.descricao}`.toLowerCase();
      return hay.includes(term);
    });
  }, [artigos, categoria, search]);

  const stats = useMemo(() => {
    const countBy = (key: PenaltyKey) => artigos.filter((i) => Boolean(i[key])).length;
    return {
      total: artigos.length,
      multa: countBy("multa"),
      retencao: countBy("retencao"),
      remocao: countBy("remocao"),
      apreensao: countBy("apreensao"),
      revogacao: countBy("revogacao"),
      prisao: countBy("prisao"),
    };
  }, [artigos]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (a: CTBArticle) => {
    setEditing(a);
    setForm({
      categoria: a.categoria,
      artigo: a.artigo,
      descricao: a.descricao,
      multa: a.multa,
      retencao: a.retencao,
      remocao: a.remocao,
      apreensao: a.apreensao,
      revogacao: a.revogacao,
      prisao: a.prisao,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!isAdmin) return;
    if (!form.categoria.trim() || !form.artigo.trim() || !form.descricao.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha categoria, artigo e descrição.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editing) {
        await updateArticle.mutateAsync({ id: editing.id, patch: form });
        toast({ title: "Artigo atualizado" });
      } else {
        await createArticle.mutateAsync(form);
        toast({ title: "Artigo criado" });
      }
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Erro ao salvar.", variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("Excluir este artigo do CTB?")) return;
    try {
      await deleteArticle.mutateAsync(id);
      toast({ title: "Artigo excluído" });
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Erro ao excluir.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-2xl font-bold">CTB</h2>
          <p className="text-sm text-muted-foreground">Gerencie artigos e penalidades do CTB.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo artigo
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total de Artigos</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
          <p className="text-sm text-muted-foreground">Com Multa</p>
          <p className="text-2xl font-bold text-foreground">{stats.multa}</p>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
          <p className="text-sm text-muted-foreground">Com Retenção</p>
          <p className="text-2xl font-bold text-foreground">{stats.retencao}</p>
        </div>
        <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
          <p className="text-sm text-muted-foreground">Com Prisão</p>
          <p className="text-2xl font-bold text-foreground">{stats.prisao}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border/50">
        <div className="p-6 border-b border-border/50 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categorias.map((c) => (
                <Button
                  key={c}
                  size="sm"
                  variant={categoria === c ? "default" : "outline"}
                  onClick={() => setCategoria(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          {!isAdmin && (
            <p className="text-sm text-muted-foreground">
              Você pode visualizar os artigos aqui, mas apenas administradores podem criar/editar/excluir.
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="p-10 flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Carregando...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Categoria</th>
                  <th className="text-left p-4 font-semibold text-sm">Artigo</th>
                  <th className="text-left p-4 font-semibold text-sm">Descrição</th>
                  {penalties.map((p) => (
                    <th key={p.key} className="text-left p-4 font-semibold text-sm whitespace-nowrap">
                      {p.label}
                    </th>
                  ))}
                  {isAdmin && <th className="text-right p-4 font-semibold text-sm">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">{a.categoria}</td>
                    <td className="p-4 font-mono font-semibold">{a.artigo}</td>
                    <td className="p-4 text-muted-foreground">{a.descricao}</td>
                    {penalties.map((p) => (
                      <td key={p.key} className="p-4">
                        {a[p.key] ? (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-success/15 text-success">
                            SIM
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-muted text-muted-foreground">
                            NÃO
                          </span>
                        )}
                      </td>
                    ))}
                    {isAdmin && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(a)} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(a.id)}
                            title="Excluir"
                            disabled={deleteArticle.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar artigo" : "Novo artigo"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Input value={form.categoria} onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))} />
            </div>
            <div>
              <Label>Artigo</Label>
              <Input value={form.artigo} onChange={(e) => setForm((p) => ({ ...p, artigo: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Input value={form.descricao} onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))} />
            </div>

            <div className="md:col-span-2">
              <Label>Penalidades</Label>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                {penalties.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 rounded-lg border border-border/50 p-3">
                    <Checkbox
                      checked={Boolean(form[p.key])}
                      onCheckedChange={(v) => setForm((prev) => ({ ...prev, [p.key]: Boolean(v) }))}
                    />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={!isAdmin || createArticle.isPending || updateArticle.isPending}>
              {(createArticle.isPending || updateArticle.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CTBContent;
