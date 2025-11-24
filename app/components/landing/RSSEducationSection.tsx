"use client";

import { motion } from "framer-motion";
import { Rss, RefreshCw, Bell, Shield } from "lucide-react";

export function RSSEducationSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-foreground lg:text-5xl">
              What is RSS? 🤔
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-foreground/70 lg:text-xl">
              RSS (Really Simple Syndication) is like having a personal newsstand where all your favorite websites deliver their latest updates directly to you.
            </p>
          </motion.div>

          {/* Visual Flow Diagram */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-16 grid gap-6 md:grid-cols-3"
          >
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Rss className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Subscribe</h3>
              <p className="text-foreground/70">
                Add RSS feeds from your favorite blogs, news sites, and podcasts
              </p>
              {/* Arrow */}
              <div className="absolute -right-3 top-8 hidden text-primary/30 md:block">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
                <RefreshCw className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Auto-Update</h3>
              <p className="text-foreground/70">
                NeuReed automatically fetches new content from all your feeds
              </p>
              {/* Arrow */}
              <div className="absolute -right-3 top-8 hidden text-accent/30 md:block">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <Bell className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">Read & Enjoy</h3>
              <p className="text-foreground/70">
                All your content in one beautiful, ad-free reading experience
              </p>
            </div>
          </motion.div>

          {/* Why RSS Matters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl border border-border bg-background p-8 lg:p-12"
          >
            <h3 className="mb-8 text-center text-3xl font-bold text-foreground">
              Why RSS Still Matters in 2025
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Benefit 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-foreground">No Algorithmic Timeline</h4>
                  <p className="text-foreground/70">
                    See everything chronologically. No hidden posts, no engagement manipulation.
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    🎯
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-foreground">Privacy & Control</h4>
                  <p className="text-foreground/70">
                    Your data stays yours. No tracking, no data mining, no surveillance.
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    🚀
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-foreground">Ad-Free Experience</h4>
                  <p className="text-foreground/70">
                    Read without distractions. No sponsored posts, no promoted content.
                  </p>
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    🌐
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold text-foreground">Platform Independent</h4>
                  <p className="text-foreground/70">
                    Subscribe to any site with an RSS feed. Own your content consumption.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
