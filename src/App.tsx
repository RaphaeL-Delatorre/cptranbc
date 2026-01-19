import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Hierarquia from "./pages/Hierarquia";
import Regulamentos from "./pages/Regulamentos";
import CTB from "./pages/CTB";
import AIT from "./pages/AIT";
import Sobre from "./pages/Sobre";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Setup from "./pages/Setup";
import PoliceProfile from "./pages/PoliceProfile";
import BatePonto from "./pages/BatePonto";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/hierarquia" element={<Hierarquia />} />
          <Route path="/regulamentos" element={<Regulamentos />} />
          <Route path="/ctb" element={<CTB />} />
          <Route path="/ait" element={<AIT />} />
          <Route path="/bate-ponto" element={<BatePonto />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/policial/:name" element={<PoliceProfile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
