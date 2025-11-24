"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How is NeuReed different from Feedly or Inoreader?",
    answer: "NeuReed uses AI to learn your reading preferences over time, offering truly personalized recommendations. Unlike Feedly's limited AI features or Inoreader's complex interface, NeuReed provides semantic search that understands meaning, not just keywords. Plus, it's self-hosted and open source, giving you complete control over your data and privacy.",
  },
  {
    question: "Is NeuReed really free?",
    answer: "Yes! NeuReed is completely free and open source. You can self-host it on your own infrastructure. If you choose to use OpenAI embeddings for semantic search, you'll pay OpenAI directly for API usage (typically pennies per month). Alternatively, you can use free local embeddings with BGE-small models for zero ongoing costs.",
  },
  {
    question: "What's semantic search and why should I care?",
    answer: "Semantic search understands the meaning behind your query, not just matching keywords. For example, searching 'how to be more productive' will find articles about time management, focus techniques, and workflow optimization—even if they don't contain those exact words. It's like having a research assistant who actually understands what you're looking for.",
  },
  {
    question: "Can I import my existing feeds?",
    answer: "Yes! NeuReed supports standard OPML import, so you can easily bring your feeds from Feedly, Inoreader, or any other RSS reader. Just export your feeds as an OPML file and import them into NeuReed. Your categories and organization will be preserved.",
  },
  {
    question: "Do I need to know how to code?",
    answer: "For basic usage, no coding knowledge is required. The Docker deployment is straightforward with docker-compose. However, if you want to customize or contribute to the project, familiarity with Next.js, React, and PostgreSQL will be helpful. The documentation provides step-by-step setup instructions.",
  },
  {
    question: "How does the AI personalization work?",
    answer: "NeuReed learns from both explicit feedback (thumbs up/down) and implicit signals (reading time, article completion). It uses TF-IDF to extract keywords from articles you like and builds a pattern of your interests. Over time, it scores new articles based on how well they match your patterns, surfacing the most relevant content first.",
  },
  {
    question: "What about privacy and data security?",
    answer: "Since NeuReed is self-hosted, all your data stays on your own server. We don't collect any telemetry or usage statistics. Your reading history, preferences, and feed subscriptions never leave your infrastructure. You have complete control over your data, backups, and security configurations.",
  },
  {
    question: "How often are feeds updated?",
    answer: "By default, NeuReed checks all feeds every 30 minutes via automated cron jobs. You can customize refresh intervals globally or per-feed based on how frequently sites publish. You can also manually trigger refreshes anytime from the admin dashboard.",
  },
];

function FAQItem({ faq, index }: { faq: typeof faqs[0]; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-lg border border-border bg-background overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
      >
        <span className="font-semibold text-foreground">{faq.question}</span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-foreground/70 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all ${
          isOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="px-6 pb-4 text-foreground/70">{faq.answer}</div>
      </div>
    </motion.div>
  );
}

export function FAQSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-foreground lg:text-5xl">
              Frequently Asked Questions
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-foreground/70">
              Everything you need to know about NeuReed
            </p>
          </motion.div>

          {/* FAQ List */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={faq.question} faq={faq} index={index} />
            ))}
          </div>

          {/* Additional Help */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 text-center"
          >
            <p className="text-foreground/70">
              Still have questions?{" "}
              <a
                href="https://github.com/madpin/Neureed/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                Open an issue on GitHub
              </a>
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
