"use client";

import { HeroSection } from "./HeroSection";
import { RSSEducationSection } from "./RSSEducationSection";
import { FeaturesSection } from "./FeaturesSection";
import { ComparisonTable } from "./ComparisonTable";
import { ScreenshotsGallery } from "./ScreenshotsGallery";
import { TechnicalSection } from "./TechnicalSection";
import { FAQSection } from "./FAQSection";
import { CTASection } from "./CTASection";
import { Footer } from "./Footer";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <RSSEducationSection />
      <FeaturesSection />
      <ComparisonTable />
      <ScreenshotsGallery />
      <TechnicalSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
