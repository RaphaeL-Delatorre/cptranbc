import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGallery } from "@/hooks/useGallery";

export const GallerySection = () => {
  const { data: images = [], isLoading } = useGallery();
  const [currentIndex, setCurrentIndex] = useState(0);

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

        <div className="relative max-w-5xl mx-auto">
          {/* Main image */}
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl border border-border/50">
            <img
              src={images[currentIndex].image_url}
              alt={images[currentIndex].title || `Imagem ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
            {images[currentIndex].title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <p className="text-white font-medium text-lg">{images[currentIndex].title}</p>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={prevImage}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={nextImage}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex justify-center gap-3 mt-6">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? "border-primary scale-105"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={image.title || `Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
