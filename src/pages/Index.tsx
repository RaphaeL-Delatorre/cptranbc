import { MainLayout } from "@/components/layout/MainLayout";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";
import { GallerySection } from "@/components/home/GallerySection";

const Index = () => {
  return (
    <MainLayout>
      <HeroSection />
      <StatsSection />
      <GallerySection />
    </MainLayout>
  );
};

export default Index;
