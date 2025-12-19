import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Users, FileText, Car, Info, LogOut, Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { useNoticias } from "@/hooks/useNoticias";
import { useCheckPermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const navItems = [
  { name: "Início", path: "/", icon: Home },
  { name: "Hierarquia", path: "/hierarquia", icon: Users },
  { name: "Regulamentos", path: "/regulamentos", icon: FileText },
  { name: "AIT", path: "/ait", icon: Car },
  { name: "Ponto", path: "/ponto", icon: Clock },
  { name: "Sobre", path: "/sobre", icon: Info },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { data: noticias = [] } = useNoticias(true);
  const { hasPermission } = useCheckPermissions(user?.id);
  
  const canAccessDashboard = hasPermission("acessar_dashboard");

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-primary/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              alt="Logo CPTran"
              className="h-10 w-10 object-contain transition-all duration-300 group-hover:scale-110"
              src="/favicon.png"
            />
            <div className="hidden sm:block">
              <h1 className="font-display text-lg font-bold text-primary neon-text">
                CPTran
              </h1>
              <p className="text-xs text-muted-foreground">Policiamento de Trânsito</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              // Hide Ponto if user is not logged in
              if (item.path === "/ponto" && !user) return null;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-neon"
                      : "text-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Online Status */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-success/20 rounded-full border border-success/30">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs text-success font-medium">Online</span>
              </div>
            )}

            {/* Notifications */}
            <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary hover:bg-primary/10">
                  <Bell className="h-5 w-5" />
                  {noticias.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
                      {noticias.length > 9 ? "9+" : noticias.length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-card border-border/50" align="end">
                <div className="p-4 border-b border-border/50">
                  <h3 className="font-display font-semibold text-foreground">Notificações</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {noticias.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      Nenhuma notificação
                    </div>
                  ) : (
                    noticias.map((noticia) => (
                      <div key={noticia.id} className="p-4 border-b border-border/30 hover:bg-muted/50 transition-colors">
                        <h4 className="font-semibold text-sm text-foreground">{noticia.titulo}</h4>
                        {noticia.subtitulo && (
                          <p className="text-xs text-muted-foreground mt-1">{noticia.subtitulo}</p>
                        )}
                        <p className="text-xs text-primary mt-2">
                          {format(new Date(noticia.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Admin Button */}
            {canAccessDashboard ? (
              <Link to="/dashboard">
                <Button className="hidden sm:flex bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon">
                  ADMINISTRATIVO
                </Button>
              </Link>
            ) : (
              <Link to="/admin">
                <Button className="hidden sm:flex bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon">
                  ENTRAR
                </Button>
              </Link>
            )}

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 text-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-primary/10 transition-colors text-foreground"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary/20 animate-slide-up">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                if (item.path === "/ponto" && !user) return null;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-primary/10"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              
              {canAccessDashboard ? (
                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full mt-2 bg-primary text-primary-foreground shadow-neon">
                    ADMINISTRATIVO
                  </Button>
                </Link>
              ) : (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full mt-2 bg-primary text-primary-foreground shadow-neon">
                    ENTRAR
                  </Button>
                </Link>
              )}
              
              {user && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full mt-2 justify-start gap-3 text-foreground hover:text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
