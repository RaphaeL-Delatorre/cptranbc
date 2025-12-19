import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGallery } from "@/hooks/useGallery";

export const GallerySection = () => {
  const { data: images = [], isLoading } = useGallery();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate every 4 seconds
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);

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
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-[80px]" />

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ImageIcon className="h-8 w-8 text-primary" />
            <h2 className="font-display text-3xl md:text-4xl font-black text-foreground">
              Galeria <span className="text-primary neon-text">CPTran</span>
            </h2>
          </div>
          <p className="text-muted-foreground">Operações e Atividades</p>
          <div className="mt-4 h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>

        <div className="relative max-w-5xl mx-auto flex items-center gap-4">
          {/* Left Arrow */}
          {images.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 bg-card/80 backdrop-blur-sm hover:bg-card border-primary/30 hover:border-primary hover:shadow-glow transition-all duration-300"
              onClick={prevImage}
            >
              <ChevronLeft className="h-5 w-5 text-primary" />
            </Button>
          )}

          {/* Main image */}
          <div className="flex-1 relative aspect-video rounded-2xl overflow-hidden shadow-neon border border-primary/20 group">
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-[-2px] rounded-2xl bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 blur-md" />
            </div>
            
            <img
              src={images[currentIndex].image_url}
              alt={images[currentIndex].title || `Imagem ${currentIndex + 1}`}
              className="relative w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Title overlay */}
            {images[currentIndex].title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent p-6">
                <p className="text-foreground font-semibold text-lg">{images[currentIndex].title}</p>
              </div>
            )}

            {/* Image counter */}
            <div className="absolute top-4 right-4 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full text-sm font-medium text-foreground border border-primary/30">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          {/* Right Arrow */}
          {images.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              className="shrink-0 bg-card/80 backdrop-blur-sm hover:bg-card border-primary/30 hover:border-primary hover:shadow-glow transition-all duration-300"
              onClick={nextImage}
            >
              <ChevronRight className="h-5 w-5 text-primary" />
            </Button>
          )}
        </div>

        {/* Dots indicator */}
        {images.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-8 bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
