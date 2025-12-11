import { MainLayout } from "@/components/layout/MainLayout";
import { FileText, ExternalLink, Book, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

const regulamentos = [
  {
    id: 1,
    titulo: "Código de Trânsito Brasileiro - CTB",
    descricao: "Lei nº 9.503, de 23 de setembro de 1997. Institui o Código de Trânsito Brasileiro e estabelece as normas de circulação e conduta.",
    icon: Scale,
    categoria: "Legislação Principal",
  },
  {
    id: 2,
    titulo: "Regulamento Interno",
    descricao: "Normas internas de conduta e procedimentos operacionais do Departamento de Trânsito.",
    icon: Book,
    categoria: "Normas Internas",
  },
  {
    id: 3,
    titulo: "Manual de Autuação",
    descricao: "Procedimentos padrão para lavratura de Auto de Infração de Trânsito (AIT) e medidas administrativas.",
    icon: FileText,
    categoria: "Procedimentos",
  },
  {
    id: 4,
    titulo: "Tabela de Infrações",
    descricao: "Relação completa de infrações de trânsito, penalidades e medidas administrativas aplicáveis.",
    icon: FileText,
    categoria: "Referência",
  },
  {
    id: 5,
    titulo: "Manual de Abordagem",
    descricao: "Procedimentos e protocolos para abordagem de condutores e fiscalização em via pública.",
    icon: Book,
    categoria: "Procedimentos",
  },
  {
    id: 6,
    titulo: "Código de Ética",
    descricao: "Princípios e valores que norteiam a conduta dos agentes do Departamento de Trânsito.",
    icon: Scale,
    categoria: "Normas Internas",
  },
];

const RegulamentoCard = ({ regulamento }: { regulamento: typeof regulamentos[0] }) => {
  const Icon = regulamento.icon;
  
  return (
    <div className="group bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-border/50 relative overflow-hidden">
      {/* Category Badge */}
      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
        {regulamento.categoria}
      </span>

      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="h-6 w-6 text-primary" />
      </div>

      {/* Content */}
      <h3 className="font-display text-xl font-bold text-foreground mb-2">
        {regulamento.titulo}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {regulamento.descricao}
      </p>

      {/* Action Button */}
      <Button variant="outline" size="sm" className="group/btn">
        <span>Ver documento</span>
        <ExternalLink className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
      </Button>

      {/* Decorative Line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </div>
  );
};

const Regulamentos = () => {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regulamentos.map((regulamento) => (
              <RegulamentoCard key={regulamento.id} regulamento={regulamento} />
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Regulamentos;
