import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCTBArticles, type CTBArticle } from "@/hooks/useCTB";
import { FileText, Loader2, Search } from "lucide-react";

const penalties = [
  { key: "multa", label: "Multa" },
  { key: "retencao", label: "Retenção" },
  { key: "remocao", label: "Remoção" },
  { key: "apreensao", label: "Apreensão" },
  { key: "revogacao", label: "Revogação" },
  { key: "prisao", label: "Prisão" },
] as const;

type PenaltyKey = (typeof penalties)[number]["key"];

const yesNoBadge = (value: boolean) =>
  value ? (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-success/15 text-success">SIM</span>
  ) : (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-muted text-muted-foreground">NÃO</span>
  );

const countBy = (items: CTBArticle[], key: PenaltyKey) => items.filter((i) => Boolean(i[key])).length;

const CTB = () => {
  const { data: artigos = [], isLoading } = useCTBArticles();
  const [categoria, setCategoria] = useState<string>("Todas");
  const [search, setSearch] = useState<string>("");
  const [activePenalties, setActivePenalties] = useState<PenaltyKey[]>([]);

  const categorias = useMemo(() => {
    const set = new Set<string>();
    artigos.forEach((a) => set.add(a.categoria));
    return ["Todas", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [artigos]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return artigos.filter((a) => {
      if (categoria !== "Todas" && a.categoria !== categoria) return false;
      if (activePenalties.length > 0 && !activePenalties.every((p) => Boolean(a[p]))) return false;
      if (!term) return true;
      const hay = `${a.categoria} ${a.artigo} ${a.descricao}`.toLowerCase();
      return hay.includes(term);
    });
  }, [artigos, categoria, activePenalties, search]);

  const stats = useMemo(() => {
    return {
      total: artigos.length,
      multa: countBy(artigos, "multa"),
      retencao: countBy(artigos, "retencao"),
      remocao: countBy(artigos, "remocao"),
      apreensao: countBy(artigos, "apreensao"),
      revogacao: countBy(artigos, "revogacao"),
      prisao: countBy(artigos, "prisao"),
    };
  }, [artigos]);

  return (
    <MainLayout>
      <section className="py-16 md:py-20 hero-gradient">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-secondary-foreground">
              CTB
            </h1>
            <p className="mt-3 text-secondary-foreground/80">
              Consulta rápida de artigos e penalidades (Código de Trânsito Brasileiro).
            </p>
          </div>
        </div>
      </section>

      <main className="py-12 bg-background">
        <div className="container mx-auto px-4 space-y-6">
          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <p className="text-sm text-muted-foreground">Com Remoção</p>
              <p className="text-2xl font-bold text-foreground">{stats.remocao}</p>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
              <p className="text-sm text-muted-foreground">Com Apreensão</p>
              <p className="text-2xl font-bold text-foreground">{stats.apreensao}</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
              <p className="text-sm text-muted-foreground">Com Revogação</p>
              <p className="text-2xl font-bold text-foreground">{stats.revogacao}</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card border border-border/50">
              <p className="text-sm text-muted-foreground">Com Prisão</p>
              <p className="text-2xl font-bold text-foreground">{stats.prisao}</p>
            </div>
          </section>

          {/* Filters */}
          <section className="bg-card rounded-xl shadow-card border border-border/50">
            <div className="p-6 border-b border-border/50">
              <h2 className="font-display text-lg font-bold">Filtros</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {categorias.map((c) => (
                  <Button
                    key={c}
                    variant={categoria === c ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoria(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {penalties.map((p) => {
                  const active = activePenalties.includes(p.key);
                  return (
                    <Button
                      key={p.key}
                      variant={active ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setActivePenalties((prev) =>
                          active ? prev.filter((k) => k !== p.key) : [...prev, p.key]
                        )
                      }
                    >
                      {p.label}
                    </Button>
                  );
                })}
              </div>

              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por artigo, categoria ou descrição..."
                  className="pl-9"
                />
              </div>

              <p className="text-sm text-muted-foreground">Exibindo {filtered.length} de {artigos.length} artigos</p>
            </div>
          </section>

          {/* Table */}
          <section className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
            {isLoading ? (
              <div className="p-10 flex items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Carregando CTB...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground">Nenhum artigo encontrado.</div>
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filtered.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">{a.categoria}</td>
                        <td className="p-4 font-mono font-semibold">{a.artigo}</td>
                        <td className="p-4 text-muted-foreground">{a.descricao}</td>
                        {penalties.map((p) => (
                          <td key={p.key} className="p-4">{yesNoBadge(Boolean(a[p.key]))}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </MainLayout>
  );
};

export default CTB;
