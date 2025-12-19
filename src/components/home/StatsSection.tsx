import { useEffect, useState, useRef } from "react";
import { FileWarning, FileText, Receipt, Car, CreditCard, UserX } from "lucide-react";
import { useAITStats } from "@/hooks/useAITs";

interface StatCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  delay?: number;
}

const StatCard = ({ icon: Icon, value, label, prefix = "", suffix = "", delay = 0 }: StatCardProps) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const timeout = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isVisible, value, delay]);

  return (
    <div
      ref={ref}
      className="group relative bg-card rounded-2xl p-6 shadow-neon hover:shadow-glow transition-all duration-500 hover:-translate-y-2 overflow-hidden border border-primary/20 hover:border-primary/50"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated border glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-[-1px] rounded-2xl bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 blur-sm" />
      </div>

      {/* Icon */}
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
          <Icon className="h-7 w-7 text-primary" />
        </div>
      </div>

      {/* Value */}
      <div className="relative">
        <p className="font-display text-3xl md:text-4xl font-black text-foreground mb-1">
          {prefix}{count.toLocaleString('pt-BR')}{suffix}
        </p>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </div>
  );
};

export const StatsSection = () => {
  const { data: stats } = useAITStats();

  const statsData = [
    { 
      icon: FileWarning, 
      value: stats?.artigoMaisInfringido || 0, 
      label: "Artigo mais infringido", 
      prefix: stats?.artigoMaisInfringido ? "Art. " : "", 
      delay: 0 
    },
    { icon: FileText, value: stats?.totalAITs || 0, label: "Autuações (Total de AIT)", delay: 100 },
    { icon: Receipt, value: stats?.multas || 0, label: "Multas Aplicadas", delay: 200 },
    { icon: Car, value: stats?.apreensoes || 0, label: "Apreensões de Veículos", delay: 300 },
    { icon: CreditCard, value: stats?.revogacoes || 0, label: "Revogações de CNH", delay: 400 },
    { icon: UserX, value: stats?.prisoes || 0, label: "Prisões Realizadas", delay: 500 },
  ];

  return (
    <section className="py-20 bg-muted/30 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-black text-foreground mb-4">
            CPTran{" "}
            <span className="text-primary neon-text">EM NÚMEROS</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Estatísticas de Fiscalização e Controle
          </p>
          <div className="mt-4 h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {statsData.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};
