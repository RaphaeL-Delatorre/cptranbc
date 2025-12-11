import { MainLayout } from "@/components/layout/MainLayout";
import { Shield, Target, Eye, Users, Award, Clock } from "lucide-react";
import logoTransito from "@/assets/logo-transito.png";

const Sobre = () => {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative py-20 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <img 
            src={logoTransito}
            alt="Logo Trânsito"
            className="mx-auto h-24 w-24 object-contain mb-6"
          />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-secondary-foreground mb-4">
            <span className="text-primary">SOBRE</span> NÓS
          </h1>
          <p className="text-secondary-foreground/80 max-w-2xl mx-auto">
            Conheça o Departamento de Trânsito
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mission */}
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">Missão</h3>
              <p className="text-muted-foreground">
                Garantir a segurança e fluidez do trânsito através da fiscalização eficiente, 
                educação e aplicação das leis de trânsito, promovendo o respeito à vida.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Eye className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">Visão</h3>
              <p className="text-muted-foreground">
                Ser referência em fiscalização de trânsito, reconhecido pela excelência 
                operacional, integridade e compromisso com a segurança viária.
              </p>
            </div>

            {/* Values */}
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-4">Valores</h3>
              <p className="text-muted-foreground">
                Ética, transparência, profissionalismo, respeito ao cidadão e 
                compromisso com a segurança pública.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-3xl font-bold text-center text-foreground mb-12">
            Nossos <span className="text-primary">Números</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <p className="font-display text-3xl font-bold text-foreground">50+</p>
              <p className="text-sm text-muted-foreground">Agentes Ativos</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Award className="h-7 w-7 text-primary" />
              </div>
              <p className="font-display text-3xl font-bold text-foreground">98%</p>
              <p className="text-sm text-muted-foreground">Eficiência</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-7 w-7 text-primary" />
              </div>
              <p className="font-display text-3xl font-bold text-foreground">24/7</p>
              <p className="text-sm text-muted-foreground">Operação</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <p className="font-display text-3xl font-bold text-foreground">5+</p>
              <p className="text-sm text-muted-foreground">Anos de Atuação</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground mb-8">
            Entre em <span className="text-primary">Contato</span>
          </h2>
          <div className="max-w-lg mx-auto bg-card rounded-2xl p-8 shadow-card border border-border/50">
            <p className="text-muted-foreground mb-4">
              Para dúvidas, sugestões ou informações, entre em contato conosco através do Discord oficial.
            </p>
            <p className="font-semibold text-foreground">
              Departamento de Trânsito
            </p>
            <p className="text-sm text-muted-foreground">
              Fiscalização e Controle
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Sobre;
