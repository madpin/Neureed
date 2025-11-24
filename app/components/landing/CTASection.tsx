"use client";

import { motion } from "framer-motion";
import { Brain, ArrowRight } from "lucide-react";
import { SignInWithGoogleButton, SignInWithGitHubButton } from "../auth/SignInButton";

export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border bg-background p-12 text-center shadow-2xl lg:p-16">
            {/* Background decoration */}
            <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-8 -left-8 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

            {/* Content */}
            <div className="relative">
              {/* Icon */}
              <div className="mb-6 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent p-4">
                <Brain className="h-12 w-12 text-white" />
              </div>

              {/* Headline */}
              <h2 className="mb-4 text-4xl font-bold text-foreground lg:text-5xl">
                Ready to Take Control of Your Reading?
              </h2>

              {/* Subheadline */}
              <p className="mx-auto mb-8 max-w-2xl text-lg text-foreground/70 lg:text-xl">
                Join the future of RSS with AI-powered personalization, semantic search, and beautiful themes.
                Start your smarter reading experience today.
              </p>

              {/* CTA Buttons */}
              <div className="mb-6 flex flex-col items-center justify-center gap-4">
                <div className="w-full max-w-sm space-y-3">
                  <SignInWithGoogleButton />
                  <SignInWithGitHubButton />
                </div>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-foreground/60">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Free & Open Source</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Self-Hosted Privacy</span>
                </div>
              </div>

              {/* Secondary CTA */}
              <div className="mt-8">
                <a
                  href="https://github.com/madpin/Neureed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-foreground/70 transition-colors hover:text-foreground"
                >
                  <span>Prefer to deploy it yourself?</span>
                  <span className="flex items-center gap-1 font-semibold text-primary">
                    View on GitHub
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
