"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const screenshots = [
  {
    src: "/screenshots/07-main-article-reading-panel.jpeg",
    title: "Beautiful Reading Experience",
    description: "Clean, distraction-free reading with split-pane layout",
  },
  {
    src: "/screenshots/19-main-article-list-view.jpeg",
    title: "Article List View",
    description: "All your feeds in one organized, scannable list",
  },
  {
    src: "/screenshots/12-preferences-appearance-themes.jpeg",
    title: "14 Beautiful Themes",
    description: "Choose from Nord, Solarized, Rainbow, and more",
  },
  {
    src: "/screenshots/02-admin-embeddings-search.jpeg",
    title: "Semantic Search",
    description: "AI-powered search that understands meaning",
  },
  {
    src: "/screenshots/01-admin-dashboard-overview.jpeg",
    title: "Admin Dashboard",
    description: "Comprehensive stats and system monitoring",
  },
  {
    src: "/screenshots/08-feed-management-settings.jpeg",
    title: "Feed Management",
    description: "Fine-tune settings for each feed",
  },
  {
    src: "/screenshots/20-main-collapsed-sidebar.jpeg",
    title: "Collapsible Sidebar",
    description: "Maximize reading space when you need it",
  },
];

export function ScreenshotsGallery() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    // Set initial selection after mount to avoid cascading renders
    const timer = setTimeout(() => onSelect(), 0);

    emblaApi.on("select", onSelect);
    return () => {
      clearTimeout(timer);
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-foreground lg:text-5xl">
              See It In Action
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-foreground/70 lg:text-xl">
              Explore the beautiful interface and powerful features
            </p>
          </motion.div>

          {/* Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* Carousel Container */}
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex items-start gap-4">
                {screenshots.map((screenshot, index) => {
                  // Special handling for tall images
                  const isTallImage = screenshot.title === "Article List View";

                  return (
                    <div
                      key={screenshot.src}
                      className="relative min-w-0 flex-[0_0_100%] sm:flex-[0_0_80%] lg:flex-[0_0_70%]"
                    >
                      <div className="overflow-hidden rounded-2xl border border-border bg-muted shadow-2xl">
                        <Image
                          src={screenshot.src}
                          alt={screenshot.title}
                          width={1200}
                          height={800}
                          className={`w-full object-contain ${isTallImage ? 'h-[600px] object-top' : 'h-auto'}`}
                          priority={index === 0}
                          style={isTallImage ? { objectFit: 'cover' } : { maxHeight: 'none' }}
                        />
                      </div>
                      {/* Caption */}
                      <div className="mt-4 text-center">
                        <h3 className="text-xl font-semibold text-foreground">
                          {screenshot.title}
                        </h3>
                        <p className="mt-1 text-foreground/70">
                          {screenshot.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={scrollPrev}
              className="absolute left-4 top-1/3 -translate-y-1/2 rounded-full bg-background/80 p-3 text-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-background hover:scale-110 border border-border"
              aria-label="Previous screenshot"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-4 top-1/3 -translate-y-1/2 rounded-full bg-background/80 p-3 text-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-background hover:scale-110 border border-border"
              aria-label="Next screenshot"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Dots Indicator */}
            <div className="mt-8 flex justify-center gap-2">
              {screenshots.map((_, index) => (
                <button
                  key={index}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === selectedIndex
                      ? "w-8 bg-primary"
                      : "w-2 bg-foreground/20 hover:bg-foreground/40"
                  }`}
                  aria-label={`Go to screenshot ${index + 1}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
