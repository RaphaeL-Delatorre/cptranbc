import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import logoTransito from "@/assets/logo-transito.png";
export const HeroSection = () => {
  return <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center" style={{
      backgroundImage: `url(${heroBg})`
    }}>
        <div className="absolute inset-0 hero-gradient opacity-90" />
      </div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" style={{
        animationDelay: '2s'
      }} />
      </div>

      {/* Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <img src={logoTransito} alt="" className="w-[500px] h-[500px] object-contain" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <img alt="Escudo CPTran" className="mx-auto h-32 w-32 md:h-40 md:w-40 object-contain drop-shadow-2xl animate-float" src="/lovable-uploads/c3392802-cbb0-449f-8617-2ee49c222dca.png" />
        </div>

        {/* Title */}
        <div className="animate-slide-up" style={{
        animationDelay: '0.2s'
      }}>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold mb-4">
            <span className="text-primary">CPTran</span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className="animate-slide-up" style={{
        animationDelay: '0.4s'
      }}>
          <h2 className="font-display text-xl md:text-2xl text-primary/90 mb-4">
            Comando de Policiamento de Trânsito (CPTran)
          </h2>
          <p className="text-secondary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-2">
            Fiscalização e Controle de Trânsito
          </p>
          <p className="text-primary font-semibold text-lg italic">
            Segurança e Ordem
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-slide-up" style={{
        animationDelay: '0.6s'
      }}>
          <Link to="/ait">
            <Button variant="hero" size="xl" className="w-full sm:w-auto">
              <FileText className="h-5 w-5" />
              Registrar AIT
            </Button>
          </Link>
          <Link to="/hierarquia">
            <Button variant="glass" size="xl" className="w-full sm:w-auto text-secondary-foreground border-secondary-foreground/30 hover:border-primary">
              <Shield className="h-5 w-5" />
              Ver Hierarquia
            </Button>
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </section>;
};