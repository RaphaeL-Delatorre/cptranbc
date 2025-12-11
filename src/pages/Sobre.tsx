import { MainLayout } from "@/components/layout/MainLayout";
import { Shield, Target, Eye, Loader2 } from "lucide-react";
import logoTransito from "@/assets/logo-transito.png";
import { useSiteSettings, AboutPageSettings } from "@/hooks/useSiteSettings";

const Sobre = () => {
  const { data: settingsData, isLoading } = useSiteSettings("about_page");
  
  const defaultSettings: AboutPageSettings = {
    title: "Sobre o Departamento de Trânsito",
    subtitle: "Compromisso com a segurança e o bem-estar da comunidade",
    mission_title: "Nossa Missão",
    mission_text: "O Departamento de Trânsito tem como missão garantir a ordem pública e a segurança dos cidadãos.",
    vision_title: "Nossa Visão",
    vision_text: "Ser reconhecido como referência em policiamento ostensivo.",
    values: [],
    areas: []
  };
  
  const settings: AboutPageSettings = settingsData?.value 
    ? (settingsData.value as unknown as AboutPageSettings) 
    : defaultSettings;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

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
            {settings.title}
          </h1>
          <p className="text-secondary-foreground/80 max-w-2xl mx-auto">
            {settings.subtitle}
          </p>
        </div>
      </section>

      {/* Mission and Vision */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Mission */}
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground">{settings.mission_title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {settings.mission_text}
              </p>
            </div>

            {/* Vision */}
            <div className="bg-card rounded-2xl p-8 shadow-card border border-border/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Eye className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground">{settings.vision_title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {settings.vision_text}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      {settings.values && settings.values.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-display text-3xl font-bold text-foreground">Nossos Valores</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {settings.values.map((value, index) => (
                <div key={index} className="bg-card rounded-xl p-6 shadow-card border border-border/50">
                  <h4 className="font-semibold text-lg text-primary mb-2">{value.title}</h4>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Areas of Activity */}
      {settings.areas && settings.areas.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-3xl font-bold text-center text-foreground mb-12">
              Áreas de <span className="text-primary">Atuação</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {settings.areas.map((area, index) => (
                <div key={index} className="bg-card rounded-xl p-6 shadow-card border border-border/50 text-center">
                  <h4 className="font-semibold text-lg text-foreground mb-3">{area.title}</h4>
                  <p className="text-sm text-muted-foreground">{area.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
};

export default Sobre;
