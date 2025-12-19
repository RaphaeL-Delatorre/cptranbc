import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileText, Shield, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import logoCptran from "@/assets/logo-cptran.png";

export const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/80 to-background" />
      </div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Neon glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-neon" />
        <div
          className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-accent/20 rounded-full blur-[80px] animate-pulse-neon"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]"
        />
      </div>

      {/* Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <img src={logoCptran} alt="" className="w-[600px] h-[600px] object-contain" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Logo with glow */}
        <div className="mb-8 animate-fade-in">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-glow" />
            <img
              alt="Escudo CPTran"
              className="relative mx-auto h-36 w-36 md:h-44 md:w-44 object-contain drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
              src={logoCptran}
            />
          </div>
        </div>

        {/* Title with neon effect */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-black mb-4 tracking-tight">
            <span className="text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.6)] neon-text">
              CPTran
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <div className="animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <h2 className="font-display text-xl md:text-2xl text-primary/90 mb-4 font-semibold tracking-wide">
            Companhia de Policiamento de Trânsito
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-2">
            Fiscalização e Controle de Trânsito
          </p>
          <div className="flex items-center justify-center gap-2 text-primary font-semibold text-lg">
            <Zap className="h-5 w-5" />
            <span className="italic">Segurança e Ordem</span>
            <Zap className="h-5 w-5" />
          </div>
        </div>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-slide-up"
          style={{ animationDelay: "0.6s" }}
        >
          <Link to="/ait">
            <Button variant="hero" size="xl" className="w-full sm:w-auto group">
              <FileText className="h-5 w-5 transition-transform group-hover:scale-110" />
              Registrar AIT
            </Button>
          </Link>
          <Link to="/hierarquia">
            <Button
              variant="glass"
              size="xl"
              className="w-full sm:w-auto border-primary/30 hover:border-primary hover:bg-primary/10"
            >
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

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
