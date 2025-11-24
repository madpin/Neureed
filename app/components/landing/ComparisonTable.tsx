"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

const comparisons = [
  {
    feature: "AI Personalization",
    neureed: true,
    feedly: "Limited",
    inoreader: false,
    selfHosted: false,
  },
  {
    feature: "Semantic Search",
    neureed: true,
    feedly: false,
    inoreader: false,
    selfHosted: false,
  },
  {
    feature: "Self-Hosted",
    neureed: true,
    feedly: false,
    inoreader: false,
    selfHosted: true,
  },
  {
    feature: "Open Source",
    neureed: true,
    feedly: false,
    inoreader: false,
    selfHosted: true,
  },
  {
    feature: "Modern UI",
    neureed: true,
    feedly: true,
    inoreader: "Dated",
    selfHosted: "Basic",
  },
  {
    feature: "Custom Themes",
    neureed: "14 themes",
    feedly: "2 themes",
    inoreader: "2 themes",
    selfHosted: "Limited",
  },
  {
    feature: "Cost Tracking",
    neureed: true,
    feedly: false,
    inoreader: false,
    selfHosted: false,
  },
  {
    feature: "Free Tier",
    neureed: "Full",
    feedly: "Limited",
    inoreader: "Limited",
    selfHosted: "Full",
  },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="mx-auto h-5 w-5 text-green-500" />
    ) : (
      <X className="mx-auto h-5 w-5 text-red-500/50" />
    );
  }
  return <span className="text-sm">{value}</span>;
}

export function ComparisonTable() {
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
              How We Compare
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-foreground/70 lg:text-xl">
              See how NeuReed stacks up against popular RSS readers
            </p>
          </motion.div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
          >
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-foreground">
                      Feature
                    </th>
                    <th className="py-4 px-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="rounded-lg bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                          NeuReed
                        </div>
                      </div>
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-foreground/70">
                      Feedly
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-foreground/70">
                      Inoreader
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-foreground/70">
                      Self-Hosted
                      <div className="text-xs font-normal text-foreground/50">
                        (FreshRSS, etc)
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, index) => (
                    <tr
                      key={row.feature}
                      className={`border-b border-border last:border-b-0 ${
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      }`}
                    >
                      <td className="py-4 px-6 text-sm font-medium text-foreground">
                        {row.feature}
                      </td>
                      <td className="py-4 px-6 text-center bg-primary/5">
                        <div className="font-semibold text-primary">
                          <CellValue value={row.neureed} />
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-foreground/70">
                        <CellValue value={row.feedly} />
                      </td>
                      <td className="py-4 px-6 text-center text-foreground/70">
                        <CellValue value={row.inoreader} />
                      </td>
                      <td className="py-4 px-6 text-center text-foreground/70">
                        <CellValue value={row.selfHosted} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-border">
              {comparisons.map((row) => (
                <div key={row.feature} className="p-4">
                  <div className="mb-3 font-semibold text-foreground">
                    {row.feature}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
                      <span className="font-medium text-primary">NeuReed</span>
                      <CellValue value={row.neureed} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                      <span className="text-foreground/70">Feedly</span>
                      <CellValue value={row.feedly} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                      <span className="text-foreground/70">Inoreader</span>
                      <CellValue value={row.inoreader} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                      <span className="text-foreground/70">Others</span>
                      <CellValue value={row.selfHosted} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
