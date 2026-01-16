import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAITs } from "@/hooks/useAITs";
import { usePontosEletronicos, formatDuration } from "@/hooks/usePontoEletronico";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO, isWithinInterval, subWeeks, subMonths, isAfter, isBefore, startOfDay, endOfDay, subDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfYear, endOfYear, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, TrendingUp, Car, FileText, Scale, UserCheck, AlertTriangle, Shield, Users, Download, Calendar, LineChart, Clock, Trophy, TrendingDown } from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type FilterType = "semana" | "mes" | "total";
type PatrulhaFilterType = "semana" | "mes" | "ano";

export const AITStatisticsCharts = () => {
  const { data: aits = [] } = useAITs();
  const { data: pontos = [] } = usePontosEletronicos();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<FilterType>("total");
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [patrulhaFilter, setPatrulhaFilter] = useState<PatrulhaFilterType>("semana");

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
    let filtered = aits;

    // First apply date range filter if set
    if (startDate || endDate) {
      filtered = filtered.filter(ait => {
        const aitDate = parseISO(ait.created_at);
        if (startDate && endDate) {
          return isWithinInterval(aitDate, { 
            start: startOfDay(parseISO(startDate)), 
            end: endOfDay(parseISO(endDate)) 
          });
        }
        if (startDate) {
          return isAfter(aitDate, startOfDay(parseISO(startDate))) || 
                 format(aitDate, 'yyyy-MM-dd') === startDate;
        }
        if (endDate) {
          return isBefore(aitDate, endOfDay(parseISO(endDate))) || 
                 format(aitDate, 'yyyy-MM-dd') === endDate;
        }
        return true;
      });
    }

    if (filterType === "total") return filtered;

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

    return filtered.filter(ait => {
      const aitDate = parseISO(ait.created_at);
      return isWithinInterval(aitDate, { start, end });
    });
  }, [aits, filterType, selectedWeek, selectedMonth, startDate, endDate]);

  // Generate trend data for charts
  const trendData = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    
    // Daily trend for last 30 days
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
    const dailyData = days.map(day => {
      const dayAITs = aits.filter(ait => {
        const aitDate = parseISO(ait.created_at);
        return format(aitDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });
      
      return {
        date: format(day, 'dd/MM', { locale: ptBR }),
        total: dayAITs.length,
        aprovados: dayAITs.filter(a => a.status === 'aprovado').length,
        pendentes: dayAITs.filter(a => a.status === 'pendente').length,
        recusados: dayAITs.filter(a => a.status === 'recusado').length,
      };
    });

    // Weekly trend for last 12 weeks
    const twelveWeeksAgo = subWeeks(now, 12);
    const weeks = eachWeekOfInterval({ start: twelveWeeksAgo, end: now }, { locale: ptBR });
    const weeklyData = weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { locale: ptBR });
      const weekAITs = aits.filter(ait => {
        const aitDate = parseISO(ait.created_at);
        return isWithinInterval(aitDate, { start: weekStart, end: weekEnd });
      });
      
      return {
        date: format(weekStart, 'dd/MM', { locale: ptBR }),
        total: weekAITs.length,
        aprovados: weekAITs.filter(a => a.status === 'aprovado').length,
        pendentes: weekAITs.filter(a => a.status === 'pendente').length,
        recusados: weekAITs.filter(a => a.status === 'recusado').length,
      };
    });

    // Monthly trend for last 12 months
    const twelveMonthsAgo = subMonths(now, 12);
    const months = eachMonthOfInterval({ start: twelveMonthsAgo, end: now });
    const monthlyData = months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      const monthAITs = aits.filter(ait => {
        const aitDate = parseISO(ait.created_at);
        return isWithinInterval(aitDate, { start: monthStart, end: monthEnd });
      });
      
      return {
        date: format(monthStart, 'MMM/yy', { locale: ptBR }),
        total: monthAITs.length,
        aprovados: monthAITs.filter(a => a.status === 'aprovado').length,
        pendentes: monthAITs.filter(a => a.status === 'pendente').length,
        recusados: monthAITs.filter(a => a.status === 'recusado').length,
      };
    });

    return { dailyData, weeklyData, monthlyData };
  }, [aits]);

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

    // Count artigos - ALL of them
    const artigoCounts: Record<string, number> = {};
    approvedAITs.forEach(ait => {
      ait.artigos_infringidos?.forEach(art => {
        artigoCounts[art] = (artigoCounts[art] || 0) + 1;
      });
    });

    // Get ALL artigos sorted
    const allArtigos = Object.entries(artigoCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));

    // Count viaturas - ALL of them
    const viaturaCounts: Record<string, number> = {};
    approvedAITs.forEach(ait => {
      if (ait.viatura) {
        viaturaCounts[ait.viatura] = (viaturaCounts[ait.viatura] || 0) + 1;
      }
    });

    // Get ALL viaturas sorted
    const allViaturas = Object.entries(viaturaCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name: name.split(' - ')[1] || name, fullName: name, value }));

    // Count AITs by police officer - ALL of them
    const policiaCounts: Record<string, number> = {};
    approvedAITs.forEach(ait => {
      if (ait.nome_agente) {
        policiaCounts[ait.nome_agente] = (policiaCounts[ait.nome_agente] || 0) + 1;
      }
    });

    // Get ALL police officers sorted
    const allPoliciais = Object.entries(policiaCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }));

    return {
      totalAITs: approvedAITs.length,
      multas: providenciaCounts["Multa"] || providenciaCounts["Lavragem de Multa"] || 0,
      apreensoes: providenciaCounts["Apreensão do Veículo"] || 0,
      revogacoes: providenciaCounts["Revogação de CNH"] || providenciaCounts["Revogação da CNH"] || 0,
      prisoes: providenciaCounts["Prisão em Flagrante"] || providenciaCounts["Prisão do Condutor"] || 0,
      allArtigos,
      allViaturas,
      allPoliciais,
      artigoMaisInfringido: allArtigos[0]?.name || "N/A"
    };
  }, [filteredAITs]);

  // Calculate patrol time statistics (Top 10 policiais que mais/menos patrulham)
  const patrulhaStats = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    if (patrulhaFilter === "semana") {
      start = startOfWeek(now, { locale: ptBR });
      end = endOfWeek(now, { locale: ptBR });
    } else if (patrulhaFilter === "mes") {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else {
      start = startOfYear(now);
      end = endOfYear(now);
    }

    // Filter approved pontos within the time range
    const filteredPontos = pontos.filter(ponto => {
      if (ponto.status !== "aprovado") return false;
      const pontoDate = parseISO(ponto.data_inicio);
      return isWithinInterval(pontoDate, { start, end });
    });

    // Aggregate time by police officer
    const policialTimes: Record<string, { nome: string; totalSeconds: number }> = {};
    
    filteredPontos.forEach(ponto => {
      const nome = ponto.nome_policial || "Desconhecido";
      if (!policialTimes[nome]) {
        policialTimes[nome] = { nome, totalSeconds: 0 };
      }
      policialTimes[nome].totalSeconds += ponto.tempo_total_segundos || 0;
    });

    // Sort by time (descending for top, ascending for bottom)
    const sortedByTime = Object.values(policialTimes).sort((a, b) => b.totalSeconds - a.totalSeconds);
    
    const top10 = sortedByTime.slice(0, 10).map((p, idx) => ({
      rank: idx + 1,
      nome: p.nome,
      totalSeconds: p.totalSeconds,
      formatted: formatDuration(p.totalSeconds)
    }));

    // Get bottom 10 (those with least time, but at least some time)
    const withTime = sortedByTime.filter(p => p.totalSeconds > 0);
    const bottom10 = withTime.slice(-10).reverse().map((p, idx) => ({
      rank: idx + 1,
      nome: p.nome,
      totalSeconds: p.totalSeconds,
      formatted: formatDuration(p.totalSeconds)
    }));

    return { top10, bottom10 };
  }, [pontos, patrulhaFilter]);

  // Export statistics to PDF
  const exportStatisticsToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO ESTATÍSTICO DE AITs', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Comando de Policiamento de Trânsito (CPTran)', pageWidth / 2, 28, { align: 'center' });
    
    // Period info
    let periodText = "Período: Total Geral";
    if (startDate && endDate) {
      periodText = `Período: ${format(parseISO(startDate), 'dd/MM/yyyy')} a ${format(parseISO(endDate), 'dd/MM/yyyy')}`;
    } else if (filterType === "semana") {
      periodText = `Período: ${weekOptions[selectedWeek]?.label}`;
    } else if (filterType === "mes") {
      periodText = `Período: ${monthOptions[selectedMonth]?.label}`;
    }
    doc.text(periodText, pageWidth / 2, 36, { align: 'center' });

    let yPos = 48;

    // Summary Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMO GERAL', 14, yPos);
    yPos += 6;

    autoTable(doc, {
      startY: yPos,
      head: [['Indicador', 'Quantidade']],
      body: [
        ['Total de Autuações (Aprovados)', stats.totalAITs.toString()],
        ['Multas Aplicadas', stats.multas.toString()],
        ['Apreensões de Veículos', stats.apreensoes.toString()],
        ['Revogações de CNH', stats.revogacoes.toString()],
        ['Prisões Realizadas', stats.prisoes.toString()],
        ['Artigo Mais Infringido', stats.artigoMaisInfringido],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [212, 175, 55] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Artigos Table
    if (stats.allArtigos.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('ARTIGOS INFRINGIDOS', 14, yPos);
      yPos += 6;

      autoTable(doc, {
        startY: yPos,
        head: [['Posição', 'Artigo', 'Quantidade']],
        body: stats.allArtigos.map((art, idx) => [
          (idx + 1).toString(),
          art.name,
          art.value.toString()
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [212, 175, 55] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 12;
    }

    // Check if we need a new page
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    // Viaturas Table
    if (stats.allViaturas.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('VIATURAS MAIS PATRULHADAS', 14, yPos);
      yPos += 6;

      autoTable(doc, {
        startY: yPos,
        head: [['Posição', 'Viatura', 'Quantidade']],
        body: stats.allViaturas.map((vtr, idx) => [
          (idx + 1).toString(),
          vtr.fullName,
          vtr.value.toString()
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [212, 175, 55] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 12;
    }

    // Check if we need a new page
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }

    // AITs por Policial Table
    if (stats.allPoliciais.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('AITs POR POLICIAL', 14, yPos);
      yPos += 6;

      autoTable(doc, {
        startY: yPos,
        head: [['Posição', 'Policial', 'Quantidade de AITs']],
        body: stats.allPoliciais.map((pol, idx) => [
          (idx + 1).toString(),
          pol.name,
          pol.value.toString()
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [212, 175, 55] },
      });
    }

    // Footer
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`Estatisticas_AITs_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  // Data for summary cards
  const summaryData = [
    { title: "Autuações", value: stats.totalAITs, icon: FileText, color: "primary" },
    { title: "Multas Aplicadas", value: stats.multas, icon: Scale, color: "primary" },
    { title: "Apreensões de Veículos", value: stats.apreensoes, icon: Car, color: "secondary" },
    { title: "Revogações de CNH", value: stats.revogacoes, icon: UserCheck, color: "destructive" },
    { title: "Prisões Realizadas", value: stats.prisoes, icon: Shield, color: "destructive" },
  ];

  const handlePoliceClick = (name: string) => {
    navigate(`/policial/${encodeURIComponent(name)}`);
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Estatísticas de AITs
            </CardTitle>
            <Button onClick={exportStatisticsToPDF} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Date Range Filter */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Filtro por Data:</Label>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-sm">De:</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Até:</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-40"
                  />
                </div>
                {(startDate || endDate) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Period Filter */}
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

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              Tendência Mensal (12 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={trendData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="Total"
                    stroke="hsl(43, 96%, 56%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(43, 96%, 56%)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="aprovados" 
                    name="Aprovados"
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(142, 76%, 36%)' }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Tendência Semanal (12 semanas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="aprovados" name="Aprovados" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pendentes" name="Pendentes" fill="hsl(43, 96%, 56%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recusados" name="Recusados" fill="hsl(0, 72%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All Artigos List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Todos os Artigos Infringidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.allArtigos.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {stats.allArtigos.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* All Viaturas List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Viaturas Mais Patrulhadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.allViaturas.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {stats.allViaturas.map((item, index) => (
                  <div key={item.fullName} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-sm font-bold text-secondary-foreground">
                        {index + 1}
                      </span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="px-3 py-1 bg-secondary/10 text-secondary-foreground rounded-full font-bold">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        {/* All AITs por Policial */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              AITs por Policial
              <span className="text-sm font-normal text-muted-foreground">(clique para ver perfil)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.allPoliciais.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {stats.allPoliciais.map((item, index) => (
                    <div 
                      key={item.name} 
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handlePoliceClick(item.name)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-medium truncate">{item.name}</span>
                      </div>
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold shrink-0 ml-2">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patrol Time Statistics */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Top 10 Policiais - Tempo de Patrulha
              </CardTitle>
              <Select value={patrulhaFilter} onValueChange={(v: PatrulhaFilterType) => setPatrulhaFilter(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Semanal</SelectItem>
                  <SelectItem value="mes">Mensal</SelectItem>
                  <SelectItem value="ano">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 10 que MAIS patrulham */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-success">
                <Trophy className="h-5 w-5" />
                Mais Patrulham
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patrulhaStats.top10.length > 0 ? (
                <div className="space-y-2">
                  {patrulhaStats.top10.map((item) => (
                    <div 
                      key={item.nome} 
                      className="flex items-center justify-between p-3 bg-success/5 rounded-lg hover:bg-success/10 transition-colors cursor-pointer"
                      onClick={() => handlePoliceClick(item.nome)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          item.rank === 1 ? "bg-yellow-500 text-yellow-950" :
                          item.rank === 2 ? "bg-gray-400 text-gray-950" :
                          item.rank === 3 ? "bg-amber-600 text-amber-950" :
                          "bg-success/10 text-success"
                        }`}>
                          {item.rank}
                        </span>
                        <span className="font-medium truncate">{item.nome}</span>
                      </div>
                      <span className="px-3 py-1 bg-success/10 text-success rounded-full font-bold text-sm shrink-0 ml-2 font-mono">
                        {item.formatted}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum dado disponível para o período</p>
              )}
            </CardContent>
          </Card>

          {/* Top 10 que MENOS patrulham */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <TrendingDown className="h-5 w-5" />
                Menos Patrulham
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patrulhaStats.bottom10.length > 0 ? (
                <div className="space-y-2">
                  {patrulhaStats.bottom10.map((item) => (
                    <div 
                      key={item.nome} 
                      className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
                      onClick={() => handlePoliceClick(item.nome)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center text-sm font-bold text-destructive shrink-0">
                          {item.rank}
                        </span>
                        <span className="font-medium truncate">{item.nome}</span>
                      </div>
                      <span className="px-3 py-1 bg-destructive/10 text-destructive rounded-full font-bold text-sm shrink-0 ml-2 font-mono">
                        {item.formatted}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhum dado disponível para o período</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
