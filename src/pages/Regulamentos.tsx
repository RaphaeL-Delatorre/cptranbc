import { MainLayout } from "@/components/layout/MainLayout";
import { FileText, ExternalLink, Loader2, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRegulamentos, Regulamento } from "@/hooks/useRegulamentos";

const RegulamentoCard = ({ regulamento }: { regulamento: Regulamento }) => {
  return (
    <div className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border/50 relative overflow-hidden">
      {/* Category Badge */}
      {regulamento.categoria && (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
          {regulamento.categoria}
        </span>
      )}

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <FileText className="h-6 w-6 text-primary" />
      </div>

      {/* Content */}
      <h3 className="font-display text-xl font-bold text-foreground mb-2">
        {regulamento.titulo}
      </h3>
      {regulamento.descricao && (
        <p className="text-sm text-muted-foreground mb-4">
          {regulamento.descricao}
        </p>
      )}

      {/* Action Button */}
      {regulamento.documento_url && (
        <Button
          variant="outline"
          size="sm"
          className="group/btn"
          onClick={() => window.open(regulamento.documento_url!, "_blank")}
        >
          <span>Ver documento</span>
          <ExternalLink className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
        </Button>
      )}

      {/* Decorative Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </div>
  );
};

const Regulamentos = () => {
  const { data: regulamentos = [], isLoading } = useRegulamentos();

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-20 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-secondary-foreground mb-4">
            <span className="text-primary">REGULAMENTOS</span>
          </h1>
          <p className="text-secondary-foreground/80 max-w-2xl mx-auto">
            Documentos, normas e procedimentos do Departamento de Trânsito
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando regulamentos...</span>
            </div>
          ) : regulamentos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regulamentos.map((regulamento) => (
                <RegulamentoCard key={regulamento.id} regulamento={regulamento} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <FileQuestion className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum regulamento cadastrado</h3>
              <p className="text-muted-foreground">
                Os regulamentos serão adicionados em breve.
              </p>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default Regulamentos;
