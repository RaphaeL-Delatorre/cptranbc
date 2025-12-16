import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAITs } from "@/hooks/useAITs";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO, isWithinInterval, subWeeks, subMonths, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, TrendingUp, Car, FileText, Scale, UserCheck, AlertTriangle, Shield, Users, Download, Calendar } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type FilterType = "semana" | "mes" | "total";

export const AITStatisticsCharts = () => {
  const { data: aits = [] } = useAITs();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<FilterType>("total");
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    // Policiais Table
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
    </div>
  );
};
