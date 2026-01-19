import { useMemo, useState, useEffect } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useRoles";
import {
  useCTBArticles,
  useCreateCTBArticle,
  useUpdateCTBArticle,
  useDeleteCTBArticle,
  useReorderCTBArticles,
  type CTBArticle,
} from "@/hooks/useCTB";
import { FileText, GripVertical, Loader2, Plus, Search, Trash2, Edit, BadgeDollarSign, Hand, Truck, AlertTriangle, Ban, Shield } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const CTB_CATEGORIES = ["Documentação", "Estacionamento", "Flagrantes", "Contra a Vida"] as const;

type CTBCategory = (typeof CTB_CATEGORIES)[number];

const categoryStyle = (categoria: string) => {
  switch (categoria) {
    case "Documentação":
      return "bg-category-doc/15 text-category-doc border-category-doc/30";
    case "Estacionamento":
      return "bg-category-est/15 text-category-est border-category-est/30";
    case "Flagrantes":
      return "bg-category-flag/15 text-category-flag border-category-flag/30";
    case "Contra a Vida":
      return "bg-category-vida/15 text-category-vida border-category-vida/30";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
};

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
  categoria: CTBCategory | "";
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

function SortableRow({
  article,
  isAdmin,
  onEdit,
  onDelete,
  deleting,
}: {
  article: CTBArticle;
  isAdmin: boolean;
  onEdit: (a: CTBArticle) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: article.id,
    disabled: !isAdmin,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-muted/30 transition-colors">
      <td className="p-4 w-10">
        {isAdmin && (
          <button
            type="button"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border/50 bg-card hover:bg-muted/40"
            title="Arrastar para reordenar"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </td>

      <td className="p-4">
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${categoryStyle(article.categoria)}`}>
          {article.categoria}
        </span>
      </td>
      <td className="p-4 font-mono font-semibold">{article.artigo}</td>
      <td className="p-4 text-muted-foreground">{article.descricao}</td>

      {penalties.map((p) => (
        <td key={p.key} className="p-4">
          {article[p.key] ? (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-success/15 text-success">
              SIM
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-destructive/15 text-destructive">
              NÃO
            </span>
          )}
        </td>
      ))}

      {isAdmin && (
        <td className="p-4 text-right">
          <div className="flex items-center justify-end gap-2">
            <Button size="icon" variant="ghost" onClick={() => onEdit(article)} title="Editar">
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onDelete(article.id)}
              title="Excluir"
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </td>
      )}
    </tr>
  );
}

const CTBContent = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: roles = [] } = useUserRoles(user?.id);
  const isAdmin = roles.some((r) => r.role === "admin");

  const { data: artigos = [], isLoading } = useCTBArticles();
  const createArticle = useCreateCTBArticle();
  const updateArticle = useUpdateCTBArticle();
  const deleteArticle = useDeleteCTBArticle();
  const reorderArticles = useReorderCTBArticles();

  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<CTBCategory | null>(null);
  const [penalidade, setPenalidade] = useState<PenaltyKey | null>(null);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CTBArticle | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return artigos.filter((a) => {
      if (categoria && a.categoria !== categoria) return false;
      if (penalidade && !a[penalidade]) return false;
      if (!term) return true;
      const hay = `${a.categoria} ${a.artigo} ${a.descricao}`.toLowerCase();
      return hay.includes(term);
    });
  }, [artigos, categoria, penalidade, search]);

  // Local ordering for drag & drop (works with or without category filter)
  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  useEffect(() => {
    setOrderedIds(filtered.map((a) => a.id));
  }, [filtered]);

  const orderedFiltered = useMemo(() => {
    const byId = new Map(filtered.map((a) => [a.id, a] as const));
    return orderedIds.map((id) => byId.get(id)).filter(Boolean) as CTBArticle[];
  }, [filtered, orderedIds]);

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
      categoria: (a.categoria as CTBCategory) ?? "",
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
    if (!form.categoria || !form.artigo.trim() || !form.descricao.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione a categoria e preencha artigo e descrição.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editing) {
        await updateArticle.mutateAsync({ id: editing.id, patch: form });
        toast({ title: "Artigo atualizado" });
      } else {
        await createArticle.mutateAsync(form as any);
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!orderedIds.length || !isAdmin) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const oldIndex = orderedIds.indexOf(activeId);
    const newIndex = orderedIds.indexOf(overId);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(orderedIds, oldIndex, newIndex);
    setOrderedIds(next);

    try {
      // Reordering is global and does NOT change an article's category.
      await reorderArticles.mutateAsync({ orderedIds: next });
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Erro ao reordenar.", variant: "destructive" });
      setOrderedIds(filtered.map((a) => a.id));
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

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-category-doc/15 flex items-center justify-center">
              <FileText className="h-6 w-6 text-category-doc" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total de Artigos</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center">
              <BadgeDollarSign className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.multa}</p>
              <p className="text-sm text-muted-foreground">Com Multa</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info/15 flex items-center justify-center">
              <Hand className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.retencao}</p>
              <p className="text-sm text-muted-foreground">Com Retenção</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/15 flex items-center justify-center">
              <Truck className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.remocao}</p>
              <p className="text-sm text-muted-foreground">Com Remoção</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.apreensao}</p>
              <p className="text-sm text-muted-foreground">Com Apreensão</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet/15 flex items-center justify-center">
              <Ban className="h-6 w-6 text-violet" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.revogacao}</p>
              <p className="text-sm text-muted-foreground">Com Revogação</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/15 flex items-center justify-center">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.prisao}</p>
              <p className="text-sm text-muted-foreground">Com Prisão</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border/50">
        <div className="p-6 border-b border-border/50 space-y-4">
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por artigo ou descrição..."
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Categoria</div>
            <div className="flex flex-wrap gap-2">
              {CTB_CATEGORIES.map((c) => {
                const active = categoria === c;
                return (
                  <Button
                    key={c}
                    size="sm"
                    variant="outline"
                    className={`${categoryStyle(c)} ${active ? "ring-1 ring-ring" : ""}`}
                    onClick={() => setCategoria((prev) => (prev === c ? null : c))}
                  >
                    {c}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-semibold">Penalidade</div>
            <div className="flex flex-wrap gap-2">
              {penalties.map((p) => {
                const active = penalidade === p.key;
                return (
                  <Button
                    key={p.key}
                    size="sm"
                    variant="outline"
                    className={`${active ? "ring-1 ring-ring" : ""}`}
                    onClick={() => setPenalidade((prev) => (prev === p.key ? null : p.key))}
                  >
                    {p.label}
                  </Button>
                );
              })}
            </div>
            {isAdmin && (
              <p className="text-xs text-muted-foreground">
                Dica: você pode arrastar e soltar para ordenar (ordem única para todos os artigos).
              </p>
            )}
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold text-sm w-10">&nbsp;</th>
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

                <SortableContext
                  items={orderedFiltered.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="divide-y divide-border/50">
                    {orderedFiltered.map((a) => (
                      <SortableRow
                        key={a.id}
                        article={a}
                        isAdmin={isAdmin}
                        onEdit={openEdit}
                        onDelete={remove}
                        deleting={deleteArticle.isPending}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
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
              <Select
                value={form.categoria}
                onValueChange={(v) => setForm((p) => ({ ...p, categoria: v as CTBCategory }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CTB_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label>Penalidade</Label>
              <div className="mt-2 rounded-lg border border-border/50 p-3">
                <RadioGroup
                  value={(penalties.find((p) => Boolean(form[p.key]))?.key ?? "none") as any}
                  onValueChange={(v) =>
                    setForm((prev) => {
                      const next = { ...prev };
                      penalties.forEach((p) => {
                        next[p.key] = false;
                      });
                      if (v !== "none") next[v as PenaltyKey] = true;
                      return next;
                    })
                  }
                  className="grid grid-cols-2 md:grid-cols-3 gap-3"
                >
                  <label className="flex items-center gap-2 rounded-lg border border-border/50 p-3">
                    <RadioGroupItem value="none" />
                    <span className="text-sm">Nenhuma</span>
                  </label>
                  {penalties.map((p) => (
                    <label key={p.key} className="flex items-center gap-2 rounded-lg border border-border/50 p-3">
                      <RadioGroupItem value={p.key} />
                      <span className="text-sm">{p.label}</span>
                    </label>
                  ))}
                </RadioGroup>
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
