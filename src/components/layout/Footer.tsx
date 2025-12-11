import logoTransito from "@/assets/logo-transito.png";

export const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src={logoTransito} 
              alt="Logo Trânsito" 
              className="h-12 w-12 object-contain"
            />
            <div>
              <h3 className="font-display text-lg font-bold">DEPT. TRÂNSITO</h3>
              <p className="text-sm text-secondary-foreground/70">Fiscalização e Controle</p>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-sm text-secondary-foreground/70">
              © {new Date().getFullYear()} Departamento de Trânsito
            </p>
            <p className="text-xs text-secondary-foreground/50 mt-1">
              Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
