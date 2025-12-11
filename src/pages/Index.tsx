import { MainLayout } from "@/components/layout/MainLayout";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";

const Index = () => {
  return (
    <MainLayout>
      <HeroSection />
      <StatsSection />
    </MainLayout>
  );
};

export default Index;
