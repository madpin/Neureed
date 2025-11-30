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
                {/* Signup CTA */}
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground mb-1">
                    Try It Now - It&apos;s Free!
                  </p>
                  <p className="text-sm text-foreground/60">
                    Get started in seconds with Gmail or GitHub
                  </p>
                </div>

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

              {/* Divider */}
              <div className="mt-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-border"></div>
                <span className="text-xs text-foreground/50 uppercase tracking-wider">Or</span>
                <div className="h-px flex-1 bg-border"></div>
              </div>

              {/* Secondary CTA */}
              <div className="mt-6">
                <a
                  href="https://github.com/madpin/Neureed"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-foreground/70 transition-colors hover:text-foreground"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">View source code & self-host</span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
