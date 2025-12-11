import { MainLayout } from "@/components/layout/MainLayout";
import { Shield, Calendar, FileText, User, Loader2 } from "lucide-react";
import { useHierarquia, HierarquiaMembro } from "@/hooks/useHierarquia";

const getPatenteBadgeColor = (patente: string) => {
  switch (patente) {
    case "Coronel":
    case "Tenente-Coronel":
    case "Major":
      return "bg-primary text-primary-foreground";
    case "Capitão":
    case "1° Tenente":
    case "2° Tenente":
      return "bg-accent text-accent-foreground";
    case "Aspirante a Oficial":
    case "Subtenente":
    case "1° Sargento":
      return "bg-secondary text-secondary-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const HierarquiaCard = ({ membro }: { membro: HierarquiaMembro }) => {
  return (
    <div className="group relative bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-foreground">{membro.nome}</h3>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getPatenteBadgeColor(membro.patente)}`}>
              {membro.patente}
            </span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">RG:</span>
          <span className="font-medium text-foreground">{membro.rg}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Entrada:</span>
          <span className="font-medium text-foreground">
            {new Date(membro.data_entrada).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Function */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-start gap-2 text-sm">
          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <span className="text-muted-foreground">Função:</span>
            <p className="font-medium text-foreground">{membro.funcao}</p>
          </div>
        </div>
      </div>

      {/* Observation */}
      {membro.observacao && (
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground italic">{membro.observacao}</p>
        </div>
      )}

      {/* Decorative Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-b-2xl" />
    </div>
  );
};

const Hierarquia = () => {
  const { data: hierarquiaData, isLoading, error } = useHierarquia();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-20 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-secondary-foreground mb-4">
            <span className="text-primary">HIERARQUIA</span>
          </h1>
          <p className="text-secondary-foreground/80 max-w-2xl mx-auto">
            Estrutura organizacional do Departamento de Trânsito
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando hierarquia...</span>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-destructive">Erro ao carregar hierarquia. Tente novamente.</p>
            </div>
          ) : hierarquiaData && hierarquiaData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hierarquiaData.map((membro) => (
                <HierarquiaCard key={membro.id} membro={membro} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum membro cadastrado</h3>
              <p className="text-muted-foreground">
                A hierarquia ainda não possui membros cadastrados.
              </p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default Hierarquia;
