import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAITs } from "@/hooks/useAITs";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO, isWithinInterval, subWeeks, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, TrendingUp, Car, FileText, Scale, UserCheck, AlertTriangle, Shield } from "lucide-react";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

type FilterType = "semana" | "mes" | "total";

export const AITStatisticsCharts = () => {
  const { data: aits = [] } = useAITs();
  const [filterType, setFilterType] = useState<FilterType>("total");
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current, 1 = last week, etc
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 = current, 1 = last month, etc

  // Generate week options (last 12 weeks)
  const weekOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { locale: ptBR });
      const weekEnd = endOfWeek(subWeeks(new Date(), i), { locale: ptBR });
      options.push({
        value: i,
        label: `${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM/yyyy", { locale: ptBR })}`
      });
    }
    return options;
  }, []);

  // Generate month options (last 12 months)
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        value: i,
        label: format(date, "MMMM yyyy", { locale: ptBR })
      });
    }
    return options;
  }, []);

  // Filter AITs based on selection
  const filteredAITs = useMemo(() => {
    if (filterType === "total") return aits;

    const now = new Date();
    let start: Date, end: Date;

    if (filterType === "semana") {
      const targetDate = subWeeks(now, selectedWeek);
      start = startOfWeek(targetDate, { locale: ptBR });
      end = endOfWeek(targetDate, { locale: ptBR });
    } else {
      const targetDate = subMonths(now, selectedMonth);
      start = startOfMonth(targetDate);
      end = endOfMonth(targetDate);
    }

    return aits.filter(ait => {
      const aitDate = parseISO(ait.created_at);
      return isWithinInterval(aitDate, { start, end });
    });
  }, [aits, filterType, selectedWeek, selectedMonth]);

  // Calculate statistics
  const stats = useMemo(() => {
    const approvedAITs = filteredAITs.filter(ait => ait.status === "aprovado");

    // Count providencias
    const providenciaCounts: Record<string, number> = {};
    approvedAITs.forEach(ait => {
      ait.providencias_tomadas?.forEach(prov => {
        providenciaCounts[prov] = (providenciaCounts[prov] || 0) + 1;
      });
    });

    // Count artigos
    const artigoCounts: Record<string, number> = {};
    approvedAITs.forEach(ait => {
      ait.artigos_infringidos?.forEach(art => {
        artigoCounts[art] = (artigoCounts[art] || 0) + 1;
      });
    });

    // Get top 5 artigos
    const topArtigos = Object.entries(artigoCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    // Count viaturas
    const viaturaCounts: Record<string, number> = {};
    approvedAITs.forEach(ait => {
      if (ait.viatura) {
        viaturaCounts[ait.viatura] = (viaturaCounts[ait.viatura] || 0) + 1;
      }
    });

    // Get top 5 viaturas
    const topViaturas = Object.entries(viaturaCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name: name.split(' - ')[1] || name, value }));

    // Count AITs by police officer
    const policiaCounts: Record<string, number> = {};
    approvedAITs.forEach(ait => {
      if (ait.nome_agente) {
        policiaCounts[ait.nome_agente] = (policiaCounts[ait.nome_agente] || 0) + 1;
      }
    });

    // Get top 5 police officers
    const topPoliciais = Object.entries(policiaCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    return {
      totalAITs: approvedAITs.length,
      multas: providenciaCounts["Multa"] || 0,
      apreensoes: providenciaCounts["Apreensão do Veículo"] || 0,
      revogacoes: providenciaCounts["Revogação de CNH"] || 0,
      prisoes: providenciaCounts["Prisão em Flagrante"] || 0,
      topArtigos,
      topViaturas,
      topPoliciais,
      artigoMaisInfringido: topArtigos[0]?.name || "N/A"
    };
  }, [filteredAITs]);

  // Data for summary cards
  const summaryData = [
    { title: "Autuações", value: stats.totalAITs, icon: FileText, color: "primary" },
    { title: "Multas Aplicadas", value: stats.multas, icon: Scale, color: "accent" },
    { title: "Apreensões de Veículos", value: stats.apreensoes, icon: Car, color: "secondary" },
    { title: "Revogações de CNH", value: stats.revogacoes, icon: UserCheck, color: "destructive" },
    { title: "Prisões Realizadas", value: stats.prisoes, icon: Shield, color: "destructive" },
  ];

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Estatísticas de AITs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={filterType} onValueChange={(v: FilterType) => setFilterType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Por Semana</SelectItem>
                  <SelectItem value="mes">Por Mês</SelectItem>
                  <SelectItem value="total">Total Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType === "semana" && (
              <div className="flex-1 min-w-[200px]">
                <Select value={selectedWeek.toString()} onValueChange={(v) => setSelectedWeek(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a semana" />
                  </SelectTrigger>
                  <SelectContent>
                    {weekOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {filterType === "mes" && (
              <div className="flex-1 min-w-[200px]">
                <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value.toString()}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {summaryData.map((item) => (
          <Card key={item.title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-${item.color}/10 flex items-center justify-center`}>
                  <item.icon className={`h-5 w-5 text-${item.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Most Infringed Article Highlight */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Artigo Mais Infringido</p>
              <p className="text-xl font-bold text-primary">{stats.artigoMaisInfringido}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Artigos Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top 5 Artigos Infringidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topArtigos.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.topArtigos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" width={60} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* Top Viaturas Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Viaturas Mais Patrulhadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topViaturas.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.topViaturas}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {stats.topViaturas.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* AITs por Policial */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              AITs por Policial (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topPoliciais.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.topPoliciais}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
