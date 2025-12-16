import { useParams, useNavigate } from "react-router-dom";
import { useAITs } from "@/hooks/useAITs";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Check, X, Clock, User, Award, Car, Scale, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PoliceProfile = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { data: aits = [] } = useAITs();

  const decodedName = decodeURIComponent(name || "");
  
  // Filter AITs for this police officer
  const officerAITs = aits.filter(ait => ait.nome_agente === decodedName);
  const approvedAITs = officerAITs.filter(ait => ait.status === "aprovado");
  const pendingAITs = officerAITs.filter(ait => ait.status === "pendente");
  const rejectedAITs = officerAITs.filter(ait => ait.status === "recusado");

  // Calculate statistics
  const providenciaCounts: Record<string, number> = {};
  approvedAITs.forEach(ait => {
    ait.providencias_tomadas?.forEach(prov => {
      providenciaCounts[prov] = (providenciaCounts[prov] || 0) + 1;
    });
  });

  const artigoCounts: Record<string, number> = {};
  approvedAITs.forEach(ait => {
    ait.artigos_infringidos?.forEach(art => {
      artigoCounts[art] = (artigoCounts[art] || 0) + 1;
    });
  });

  const allArtigos = Object.entries(artigoCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  const viaturaCounts: Record<string, number> = {};
  approvedAITs.forEach(ait => {
    if (ait.viatura) {
      viaturaCounts[ait.viatura] = (viaturaCounts[ait.viatura] || 0) + 1;
    }
  });

  const allViaturas = Object.entries(viaturaCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name, value }));

  // Get graduation from most recent AIT
  const graduation = officerAITs[0]?.graduacao || "N/A";

  const stats = [
    { title: "Total de AITs", value: approvedAITs.length, icon: FileText, color: "primary" },
    { title: "Multas Aplicadas", value: providenciaCounts["Multa"] || providenciaCounts["Lavragem de Multa"] || 0, icon: Scale, color: "primary" },
    { title: "Apreensões", value: providenciaCounts["Apreensão do Veículo"] || 0, icon: Car, color: "secondary" },
    { title: "Prisões", value: providenciaCounts["Prisão em Flagrante"] || providenciaCounts["Prisão do Condutor"] || 0, icon: Shield, color: "destructive" },
  ];

  return (
    <MainLayout>
      <section className="pt-24 pb-16 min-h-screen">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          {/* Profile Header */}
          <div className="bg-card rounded-2xl p-8 shadow-lg border border-border/50 mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-12 w-12 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                  {decodedName}
                </h1>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-1 rounded-full text-sm font-semibold bg-primary/20 text-primary flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    {graduation}
                  </span>
                  <span className="text-muted-foreground">
                    {approvedAITs.length} AITs aprovados
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.title}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-${stat.color}/10 flex items-center justify-center`}>
                      <stat.icon className={`h-6 w-6 text-${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <Check className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{approvedAITs.length}</p>
                    <p className="text-sm text-muted-foreground">Aprovados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{pendingAITs.length}</p>
                    <p className="text-sm text-muted-foreground">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <X className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{rejectedAITs.length}</p>
                    <p className="text-sm text-muted-foreground">Recusados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lists Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Artigos List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Artigos Infringidos</CardTitle>
              </CardHeader>
              <CardContent>
                {allArtigos.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {allArtigos.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {index + 1}
                          </span>
                          <span className="font-medium text-sm">{item.name}</span>
                        </div>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold text-sm">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>

            {/* Viaturas List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Viaturas Utilizadas</CardTitle>
              </CardHeader>
              <CardContent>
                {allViaturas.length > 0 ? (
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {allViaturas.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center text-sm font-bold text-secondary">
                            {index + 1}
                          </span>
                          <span className="font-medium text-sm">{item.name.split(' - ')[1] || item.name}</span>
                        </div>
                        <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full font-bold text-sm">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent AITs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de AITs</CardTitle>
            </CardHeader>
            <CardContent>
              {officerAITs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-semibold text-sm">Nº</th>
                        <th className="text-left p-3 font-semibold text-sm">Condutor</th>
                        <th className="text-left p-3 font-semibold text-sm">Placa</th>
                        <th className="text-left p-3 font-semibold text-sm">Data</th>
                        <th className="text-left p-3 font-semibold text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {officerAITs.slice(0, 10).map((ait) => (
                        <tr key={ait.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium">#{ait.numero_ait}</td>
                          <td className="p-3">{ait.nome_condutor}</td>
                          <td className="p-3 font-mono">{ait.emplacamento}</td>
                          <td className="p-3 text-muted-foreground">
                            {format(new Date(ait.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              ait.status === 'aprovado' 
                                ? 'bg-success/20 text-success' 
                                : ait.status === 'recusado' 
                                  ? 'bg-destructive/20 text-destructive' 
                                  : 'bg-primary/20 text-primary'
                            }`}>
                              {ait.status === 'aprovado' ? 'Aprovado' : ait.status === 'recusado' ? 'Recusado' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhum AIT registrado</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
};

export default PoliceProfile;
