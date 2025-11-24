"use client";

import { motion } from "framer-motion";
import { Code2, Database, Zap, Container } from "lucide-react";

const techStack = [
  {
    icon: Code2,
    name: "Next.js 16",
    description: "React framework with App Router",
  },
  {
    icon: Database,
    name: "PostgreSQL + pgvector",
    description: "Vector database for semantic search",
  },
  {
    icon: Zap,
    name: "AI Embeddings",
    description: "OpenAI or local BGE-small models",
  },
  {
    icon: Container,
    name: "Docker Ready",
    description: "Easy deployment with Docker Compose",
  },
];

const features = [
  "NextAuth.js v5 authentication",
  "Prisma ORM with type-safe queries",
  "Real-time updates with React Query",
  "Redis caching for performance",
  "Automated cron jobs for feed refresh",
  "RESTful API with Zod validation",
  "TF-IDF pattern learning",
  "HNSW index for fast similarity search",
];

export function TechnicalSection() {
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
              Built with Modern Tech
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-foreground/70 lg:text-xl">
              Powered by industry-leading technologies for performance, scalability, and developer experience
            </p>
          </motion.div>

          {/* Tech Stack Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {techStack.map((tech, index) => (
              <div
                key={tech.name}
                className="flex flex-col items-center rounded-2xl border border-border bg-background p-6 text-center transition-all hover:shadow-lg hover:scale-105"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <tech.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{tech.name}</h3>
                <p className="text-sm text-foreground/70">{tech.description}</p>
              </div>
            ))}
          </motion.div>

          {/* Features List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl border border-border bg-background p-8 lg:p-12"
          >
            <h3 className="mb-8 text-center text-2xl font-bold text-foreground">
              Technical Highlights
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-1 flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-foreground/80">{feature}</span>
                </motion.div>
              ))}
            </div>

            {/* GitHub Link */}
            <div className="mt-10 text-center">
              <a
                href="https://github.com/madpin/Neureed"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 font-semibold text-background transition-all hover:bg-foreground/90"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                View Source Code
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
