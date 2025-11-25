"use client";

import { motion } from "framer-motion";
import { Brain, Search, Palette, Target, DollarSign, Lock, Bookmark, Layout } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI That Gets You",
    description: "NeuReed learns your reading patterns over time. Like articles? It finds more like them. Skip content? It learns what to deprioritize. Your feed gets smarter every day.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Bookmark,
    title: "Saved Searches",
    description: "Create persistent queries that continuously monitor all your articles. Use advanced syntax with AND/OR/NOT operators, get relevance scores, and receive smart notifications only for high-quality matches.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Layout,
    title: "Flexible Reading Modes",
    description: "Choose how you read: Side Panel (split-screen), Inline (accordion-style in the list), or Standalone (full-page). Auto-scroll to articles, customize layouts, and read your way.",
    gradient: "from-violet-500 to-purple-500",
    badge: "NEW",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description: "Search by meaning, not just keywords. Ask questions, describe concepts, and find relevant articles even when they don't contain your exact words. Powered by pgvector embeddings.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Palette,
    title: "Beautiful & Customizable",
    description: "14 stunning themes (light/dark variants), adjustable fonts, and a clean interface. From Nord to Solarized to Rainbow gradients—make it yours.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: Target,
    title: "Smart Organization",
    description: "Auto-categorization, relevance scoring, and personalized recommendations. See your most relevant content first, without manual sorting.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: DollarSign,
    title: "Cost Control",
    description: "Track OpenAI usage costs in real-time, or use free local embeddings (BGE-small). You decide the balance between performance and budget.",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Self-hosted on your infrastructure. Your data never leaves your server. No third-party tracking, no data mining, complete control.",
    gradient: "from-indigo-500 to-purple-500",
  },
];

export function FeaturesSection() {
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
              Why Choose NeuReed?
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-foreground/70 lg:text-xl">
              Traditional RSS readers are cluttered and require manual organization. NeuReed uses AI to make reading effortless.
            </p>
          </motion.div>

          {/* Features Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-background p-8 transition-all hover:shadow-xl hover:scale-105"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-5`} />

                {/* Content */}
                <div className="relative">
                  {/* Icon */}
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white`}>
                    <feature.icon className="h-6 w-6" />
                  </div>

                  {/* Title */}
                  <h3 className="mb-3 text-xl font-semibold text-foreground flex items-center gap-2">
                    {feature.title}
                    {feature.badge && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                        {feature.badge}
                      </span>
                    )}
                  </h3>

                  {/* Description */}
                  <p className="text-foreground/70">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative corner */}
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 transition-all group-hover:scale-150" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
