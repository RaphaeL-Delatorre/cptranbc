import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, Users, FileText, Car, Info, LogOut, Bell, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoTransito from "@/assets/logo-transito.png";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRoles } from "@/hooks/useRoles";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [{
  name: "Início",
  path: "/",
  icon: Home
}, {
  name: "Hierarquia",
  path: "/hierarquia",
  icon: Users
}, {
  name: "Regulamentos",
  path: "/regulamentos",
  icon: FileText
}, {
  name: "AIT",
  path: "/ait",
  icon: Car
}, {
  name: "Bate-Ponto",
  path: "/bate-ponto",
  icon: Clock
}, {
  name: "Sobre",
  path: "/sobre",
  icon: Info
}];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [newAITCount, setNewAITCount] = useState(0);
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const {
    toast
  } = useToast();
  const {
    data: userRoles = []
  } = useUserRoles(user?.id);
  const isAdminOrModerador = userRoles.some(r => r.role === "admin" || r.role === "moderador");

  // Real-time notifications for new AITs
  useEffect(() => {
    if (!isAdminOrModerador) return;
    const channel = supabase.channel('new-aits').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'aits'
    }, payload => {
      setNewAITCount(prev => prev + 1);
      toast({
        title: "Novo AIT Registrado",
        description: `AIT #${payload.new.numero_ait} aguardando aprovação`
      });
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdminOrModerador, toast]);

  const handleLogout = async () => {
    await signOut();
  };

  const clearNotifications = () => {
    setNewAITCount(0);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <img alt="Logo CPTran" className="h-10 w-10 object-contain transition-transform duration-300 group-hover:scale-110" src="/lovable-uploads/9a715676-f9f4-44ed-a7bf-b35796584151.png" />
            <div className="hidden sm:block">
              <h1 className="font-display text-lg font-bold text-foreground">
                CPTran
              </h1>
              <p className="text-xs text-muted-foreground">Policiamento de Trânsito</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive ? "bg-primary text-primary-foreground shadow-md" : "text-foreground hover:bg-muted hover:text-primary"}`}>
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Admin Button, Theme Toggle, Notifications, Logout & Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell for Admin/Moderador */}
            {isAdminOrModerador && (
              <Link to="/dashboard" onClick={clearNotifications}>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {newAITCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                      {newAITCount > 9 ? '9+' : newAITCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            <Link to="/admin">
              <Button variant="hero" size="sm" className="hidden sm:flex">
                ADMINISTRATIVO
              </Button>
            </Link>
            
            {user && (
              <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex items-center gap-2 text-foreground hover:bg-muted">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            )}
            
            <button className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-slide-up">
            <nav className="flex flex-col gap-2">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"}`}>
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                <Button variant="hero" size="lg" className="w-full mt-2">
                  ADMINISTRATIVO
                </Button>
              </Link>
              {user && (
                <Button variant="ghost" size="lg" onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }} className="w-full mt-2 justify-start gap-3">
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
