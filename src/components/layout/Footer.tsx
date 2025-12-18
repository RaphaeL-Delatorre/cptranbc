import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-card border-t border-primary/20 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Info */}
          <div className="flex items-center gap-4">
            <img
              alt="Logo CPTran"
              className="h-14 w-14 object-contain animate-glow"
              src="/lovable-uploads/9a715676-f9f4-44ed-a7bf-b35796584151.png"
            />
            <div>
              <h3 className="font-display text-xl font-bold text-primary neon-text">CPTran</h3>
              <p className="text-sm text-muted-foreground">
                Companhia de Policiamento de Trânsito
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <nav className="flex flex-wrap justify-center gap-6">
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Início
            </Link>
            <Link
              to="/hierarquia"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Hierarquia
            </Link>
            <Link
              to="/regulamentos"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Regulamentos
            </Link>
            <Link
              to="/ait"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              AIT
            </Link>
            <Link
              to="/sobre"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Sobre
            </Link>
          </nav>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CPTran
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Todos os direitos reservados
            </p>
          </div>
        </div>

        {/* Bottom Border Glow Effect */}
        <div className="mt-8 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      </div>
    </footer>
  );
};
