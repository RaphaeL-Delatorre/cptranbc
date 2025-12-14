import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGallery } from "@/hooks/useGallery";

export const GallerySection = () => {
  const { data: images = [], isLoading } = useGallery();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate every 3 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  if (isLoading || images.length === 0) {
    return null;
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            Galeria <span className="text-primary">DT</span>
          </h2>
          <p className="text-muted-foreground">Operações e Atividades</p>
        </div>

        <div className="relative max-w-5xl mx-auto flex items-center gap-4">
          {/* Left Arrow - Outside image */}
          {images.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 bg-background/80 backdrop-blur-sm hover:bg-background border-primary/30 hover:border-primary"
              onClick={prevImage}
            >
              <ChevronLeft className="h-5 w-5 text-primary" />
            </Button>
          )}

          {/* Main image with hover zoom */}
          <div className="flex-1 relative aspect-video rounded-2xl overflow-hidden shadow-xl border border-border/50 group">
            <img
              src={images[currentIndex].image_url}
              alt={images[currentIndex].title || `Imagem ${currentIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {images[currentIndex].title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <p className="text-white font-medium text-lg">{images[currentIndex].title}</p>
              </div>
            )}
          </div>

          {/* Right Arrow - Outside image */}
          {images.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 bg-background/80 backdrop-blur-sm hover:bg-background border-primary/30 hover:border-primary"
              onClick={nextImage}
            >
              <ChevronRight className="h-5 w-5 text-primary" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};