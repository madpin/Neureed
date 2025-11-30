"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, Shield, Zap } from "lucide-react";
import { SignInWithGoogleButton, SignInWithGitHubButton } from "../auth/SignInButton";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background py-20 lg:py-32">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-4 top-0 h-72 w-72 animate-pulse rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-4 top-20 h-96 w-96 animate-pulse rounded-full bg-accent/10 blur-3xl" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 animate-pulse rounded-full bg-secondary/10 blur-3xl" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
          >
            <Sparkles className="h-4 w-4" />
            AI-Powered RSS Reader
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            Your RSS Reader,{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              But Way Smarter
            </span>{" "}
            <Brain className="inline-block h-12 w-12 text-primary lg:h-16 lg:w-16" />
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mb-8 max-w-3xl text-lg text-foreground/70 sm:text-xl lg:text-2xl"
          >
            NeuReed learns what you love to read with AI-powered personalization, semantic search, and beautiful themes.
            Take control of your content—no algorithms, no ads, just your feeds.
          </motion.p>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-10 flex flex-wrap items-center justify-center gap-4 text-sm text-foreground/60"
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Self-Hosted</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-foreground/30" />
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Privacy First</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-foreground/30" />
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Open Source</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center justify-center gap-4"
          >
            {/* CTA Headline */}
            <div className="text-center">
              <p className="text-xl font-semibold text-foreground mb-2">
                Start Testing for Free
              </p>
              <p className="text-sm text-foreground/60">
                Sign up instantly with your Gmail or GitHub account • No credit card required
              </p>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <SignInWithGoogleButton />
              <SignInWithGitHubButton />
            </div>
          </motion.div>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 flex items-center gap-4"
          >
            <div className="h-px flex-1 bg-border"></div>
            <span className="text-xs text-foreground/50 uppercase tracking-wider">Or</span>
            <div className="h-px flex-1 bg-border"></div>
          </motion.div>

          {/* Secondary CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-6"
          >
            <a
              href="https://github.com/madpin/Neureed"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">View source code</span>
              <span className="text-foreground/40">•</span>
              <span>Self-host your own instance</span>
            </a>
          </motion.div>

          {/* Hero Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-16 rounded-xl border border-border bg-muted/50 p-4 shadow-2xl backdrop-blur-sm"
          >
            <div className="w-full overflow-hidden rounded-lg">
              <Image
                src="/screenshots/07-main-article-reading-panel.jpeg"
                alt="NeuReed beautiful reading experience with split-pane layout"
                width={1200}
                height={800}
                className="w-full h-auto"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
