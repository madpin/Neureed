"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { formatLocalizedDate } from "@/lib/date-utils";
import { useTriggerCronJob, type JobWithHistory, type JobLogEntry, type JobRunEntry } from "@/hooks/queries/use-admin";

export interface JobsTabProps {
  /** List of cron jobs with history */
  jobs: JobWithHistory[];
}

// Helper to format duration
const formatDuration = (ms: number | null) => {
  if (ms === null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * JobsTab component for monitoring and managing cron jobs.
 * Displays job history, logs, and provides manual trigger controls.
 *
 * @example
 * ```tsx
 * <JobsTab jobs={cronHistory?.jobs || []} />
 * ```
 */
export function JobsTab({ jobs }: JobsTabProps) {
  const triggerJobMutation = useTriggerCronJob();

  // Track which jobs are expanded (default: first job expanded)
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(
    new Set(jobs.length > 0 && jobs[0] ? [jobs[0].name] : [])
  );

  // Track which jobs have all runs visible (default: none, show only 3)
  const [showAllRuns, setShowAllRuns] = useState<Set<string>>(new Set());

  // Track which runs are expanded (default: first run of each job)
  const [expandedRuns, setExpandedRuns] = useState<Set<string>>(
    new Set(
      jobs.length > 0 && jobs[0] && jobs[0].recentRuns?.length && jobs[0].recentRuns[0]
        ? [`${jobs[0].name}-${jobs[0].recentRuns[0].id}`]
        : []
    )
  );

  // Track log filters per run
  const [logFilters, setLogFilters] = useState<Record<string, string>>({});

  const handleTrigger = (jobName: string) => {
    triggerJobMutation.mutate(jobName, {
      onSuccess: () => toast.success(`Triggered job: ${jobName}`),
      onError: () => toast.error(`Failed to trigger job: ${jobName}`),
    });
  };

  const toggleJobExpanded = (jobName: string) => {
    setExpandedJobs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobName)) {
        newSet.delete(jobName);
      } else {
        newSet.add(jobName);
      }
      return newSet;
    });
  };

  const toggleShowAllRuns = (jobName: string) => {
    setShowAllRuns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(jobName)) {
        newSet.delete(jobName);
      } else {
        newSet.add(jobName);
      }
      return newSet;
    });
  };

  const toggleRunExpanded = (runKey: string) => {
    setExpandedRuns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(runKey)) {
        newSet.delete(runKey);
      } else {
        newSet.add(runKey);
      }
      return newSet;
    });
  };

  const copyLogsToClipboard = (logs: JobLogEntry[]) => {
    const logsText = logs
      .map((log) => `[${log.level}] ${log.timestamp ? `${log.timestamp} - ` : ""}${log.message}`)
      .join("\n");

    navigator.clipboard
      .writeText(logsText)
      .then(() => {
        toast.success("Logs copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy logs");
      });
  };

  const getStatusBadgeClass = (status: string) => {
    const statusUpper = status.toUpperCase();
    if (statusUpper === "COMPLETED") {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    } else if (statusUpper === "FAILED") {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    } else if (statusUpper === "RUNNING") {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  };

  const getLogLevelBadgeColor = (level: string) => {
    const levelUpper = level.toUpperCase();
    switch (levelUpper) {
      case "ERROR":
      case "FATAL":
        return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
      case "WARN":
      case "WARNING":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";
      case "INFO":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
      case "DEBUG":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "SUCCESS":
        return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const filterLogs = (logs: JobLogEntry[], filter: string) => {
    if (!filter.trim()) return logs;
    const lowerFilter = filter.toLowerCase();
    return logs.filter(
      (log) =>
        log.message.toLowerCase().includes(lowerFilter) || log.level.toLowerCase().includes(lowerFilter)
    );
  };

  const formatTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  };

  const formatLogTimestamp = (timestamp: string | undefined) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <div className="space-y-6">
      {jobs.map((job) => {
        const isJobExpanded = expandedJobs.has(job.name);
        const isShowingAllRuns = showAllRuns.has(job.name);
        const visibleRuns = isShowingAllRuns ? job.recentRuns : job.recentRuns?.slice(0, 3) || [];
        const hasMoreRuns = (job.recentRuns?.length || 0) > 3;

        return (
          <div key={job.name} className="rounded-lg border border-border bg-background shadow-sm overflow-hidden">
            {/* Job Header */}
            <div className="bg-muted/50 px-6 py-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleJobExpanded(job.name)}
                    className="flex items-center gap-2 text-left hover:text-blue-600 transition-colors"
                  >
                    <svg
                      className={`h-5 w-5 transition-transform flex-shrink-0 ${isJobExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <h3 className="text-lg font-semibold text-foreground">{job.name}</h3>
                  </button>

                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      job.status === "running"
                        ? "bg-blue-100 text-blue-800 animate-pulse dark:bg-blue-900/30 dark:text-blue-400"
                        : job.status === "error"
                        ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {job.status}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-foreground/60">
                    <span className="font-medium">Schedule:</span> <span className="font-mono">{job.schedule}</span>
                  </div>

                  <button
                    onClick={() => handleTrigger(job.name)}
                    disabled={job.status === "running" || triggerJobMutation.isPending}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-background border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {job.status === "running" ? "Running..." : "Run Now"}
                  </button>
                </div>
              </div>

              <div className="mt-2 flex gap-6 text-sm text-foreground/70">
                <div>
                  <span className="font-medium">Last Run:</span>{" "}
                  {job.lastRun?.startedAt ? formatLocalizedDate(job.lastRun.startedAt) : "Never"}
                </div>
                <div>
                  <span className="font-medium">Next Run:</span>{" "}
                  {job.nextRun ? formatLocalizedDate(job.nextRun) : "Unknown"}
                </div>
                <div>
                  <span className="font-medium">Total Runs:</span> {job.recentRuns?.length || 0}
                </div>
              </div>
            </div>

            {/* Runs Table */}
            {isJobExpanded && (
              <div className="overflow-x-auto">
                {visibleRuns.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-muted/30 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-foreground/70 w-12"></th>
                        <th className="px-6 py-3 text-left font-semibold text-foreground/70">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-foreground/70">Started</th>
                        <th className="px-6 py-3 text-left font-semibold text-foreground/70">Completed</th>
                        <th className="px-6 py-3 text-left font-semibold text-foreground/70">Duration</th>
                        <th className="px-6 py-3 text-left font-semibold text-foreground/70">Logs</th>
                        <th className="px-6 py-3 text-left font-semibold text-foreground/70">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {visibleRuns.map((run: JobRunEntry, idx: number) => {
                        const runKey = `${job.name}-${run.id}`;
                        const isRunExpanded = expandedRuns.has(runKey);
                        const hasLogs = run.logs && Array.isArray(run.logs) && run.logs.length > 0;
                        const filter = logFilters[runKey] || "";
                        const filteredLogs = hasLogs && run.logs ? filterLogs(run.logs, filter) : [];

                        return (
                          <React.Fragment key={runKey}>
                            <tr className={`hover:bg-muted/30 transition-colors ${idx === 0 ? "bg-muted/10" : ""}`}>
                              <td className="px-6 py-4">
                                {hasLogs && (
                                  <button
                                    onClick={() => toggleRunExpanded(runKey)}
                                    className="text-foreground/60 hover:text-foreground transition-colors"
                                    title={isRunExpanded ? "Collapse logs" : "Expand logs"}
                                  >
                                    <svg
                                      className={`h-4 w-4 transition-transform ${isRunExpanded ? "rotate-90" : ""}`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                      />
                                    </svg>
                                  </button>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${getStatusBadgeClass(run.status)}`}
                                >
                                  {run.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-foreground/80 font-mono">
                                {formatTimestamp(run.startedAt)}
                              </td>
                              <td className="px-6 py-4 text-sm text-foreground/80 font-mono">
                                {run.completedAt ? formatTimestamp(run.completedAt) : "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-foreground/80 font-mono">
                                {formatDuration(run.duration || null)}
                              </td>
                              <td className="px-6 py-4 text-sm text-foreground/80">
                                {hasLogs && run.logs ? (
                                  <span className="text-foreground/60">{run.logs.length} entries</span>
                                ) : (
                                  <span className="text-foreground/40">No logs</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                {hasLogs && run.logs && (
                                  <button
                                    onClick={() => copyLogsToClipboard(run.logs!)}
                                    className="text-xs text-foreground/60 hover:text-foreground flex items-center gap-1 transition-colors"
                                    title="Copy logs to clipboard"
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                    Copy
                                  </button>
                                )}
                              </td>
                            </tr>

                            {/* Expanded Logs Section */}
                            {isRunExpanded && hasLogs && (
                              <tr>
                                <td colSpan={7} className="px-6 py-4 bg-muted/20">
                                  <div className="space-y-3">
                                    {/* Filter and header */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <h4 className="text-sm font-semibold text-foreground">Execution Logs</h4>
                                        <span className="text-xs text-foreground/50">
                                          {filter
                                            ? `${filteredLogs.length} of ${run.logs?.length || 0}`
                                            : `${run.logs?.length || 0} total`}
                                        </span>
                                      </div>

                                      {(run.logs?.length || 0) > 5 && (
                                        <input
                                          type="text"
                                          placeholder="Filter logs..."
                                          value={filter}
                                          onChange={(e) => setLogFilters((prev) => ({ ...prev, [runKey]: e.target.value }))}
                                          className="w-64 px-3 py-1.5 text-xs rounded border border-border bg-background text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                      )}
                                    </div>

                                    {/* Logs Table */}
                                    <div className="rounded-lg border border-border overflow-hidden">
                                      <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                                        <table className="w-full text-xs">
                                          <thead className="sticky top-0 bg-gray-900 dark:bg-black/90 border-b border-gray-800">
                                            <tr>
                                              <th className="px-4 py-2 text-left font-semibold text-gray-400 uppercase tracking-wider w-20">
                                                Level
                                              </th>
                                              <th className="px-4 py-2 text-left font-semibold text-gray-400 uppercase tracking-wider w-28">
                                                Time
                                              </th>
                                              <th className="px-4 py-2 text-left font-semibold text-gray-400 uppercase tracking-wider">
                                                Message
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="bg-gray-950 dark:bg-black/80 divide-y divide-gray-800">
                                            {filteredLogs.length > 0 ? (
                                              filteredLogs.map((log, logIdx) => (
                                                <tr key={logIdx} className="hover:bg-gray-900/50 transition-colors">
                                                  <td className="px-4 py-2">
                                                    <span
                                                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getLogLevelBadgeColor(log.level)}`}
                                                    >
                                                      {log.level}
                                                    </span>
                                                  </td>
                                                  <td className="px-4 py-2 text-gray-400 font-mono">
                                                    {formatLogTimestamp(log.timestamp)}
                                                  </td>
                                                  <td className="px-4 py-2 text-gray-200 dark:text-gray-300 leading-relaxed break-words">
                                                    {log.message}
                                                  </td>
                                                </tr>
                                              ))
                                            ) : (
                                              <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                                                  {filter ? "No logs match your filter" : "No logs available"}
                                                </td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}

                      {/* Show More/Less Button Row */}
                      {hasMoreRuns && (
                        <tr>
                          <td colSpan={7} className="px-6 py-3 text-center bg-muted/20 border-t border-border">
                            <button
                              onClick={() => toggleShowAllRuns(job.name)}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-2 mx-auto transition-colors"
                            >
                              {isShowingAllRuns ? (
                                <>
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                  </svg>
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                  Show {job.recentRuns.length - 3} More Runs
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-12 text-center text-foreground/50">No runs recorded yet</div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {jobs.length === 0 && (
        <div className="py-12 text-center text-foreground/50">No cron jobs configured</div>
      )}
    </div>
  );
}
