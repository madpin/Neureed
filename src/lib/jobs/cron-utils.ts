/**
 * Cron utility functions for calculating next run times and parsing expressions
 */

import cron from "node-cron";

/**
 * Calculate the next run time for a cron expression
 * Returns null if the expression is invalid
 */
export function getNextRunTime(cronExpression: string): Date | null {
  if (!cron.validate(cronExpression)) {
    return null;
  }

  // Parse the cron expression manually to calculate next run
  // Format: minute hour day month weekday
  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length < 5) {
    return null;
  }

  const now = new Date();
  const [minutePart, hourPart, dayPart, monthPart, weekdayPart] = parts;

  // Create a new date starting from current time
  let nextRun = new Date(now);
  nextRun.setSeconds(0);
  nextRun.setMilliseconds(0);

  // Helper to parse cron part (supports *, */n, specific values, ranges)
  const parseCronPart = (part: string, min: number, max: number, current: number): number | null => {
    // Handle wildcard
    if (part === "*") {
      return current;
    }

    // Handle step values (*/n)
    if (part.startsWith("*/")) {
      const step = parseInt(part.substring(2), 10);
      const next = Math.ceil((current + 1) / step) * step;
      return next <= max ? next : min;
    }

    // Handle specific value or comma-separated values
    if (part.includes(",")) {
      const values = part.split(",").map(v => parseInt(v, 10)).sort((a, b) => a - b);
      const next = values.find(v => v > current);
      return next !== undefined ? next : values[0];
    }

    // Handle range (e.g., "1-5")
    if (part.includes("-")) {
      const [start, end] = part.split("-").map(v => parseInt(v, 10));
      if (current < start) return start;
      if (current >= start && current < end) return current + 1;
      return start;
    }

    // Specific value
    const value = parseInt(part, 10);
    return !isNaN(value) ? value : null;
  };

  // Start from the next minute
  nextRun.setMinutes(nextRun.getMinutes() + 1);

  // Try to find next valid time (limit iterations to prevent infinite loops)
  for (let i = 0; i < 525600; i++) { // Max 1 year of minutes
    const minute = nextRun.getMinutes();
    const hour = nextRun.getHours();
    const day = nextRun.getDate();
    const month = nextRun.getMonth() + 1; // getMonth() is 0-indexed
    const weekday = nextRun.getDay(); // 0 = Sunday

    // Check if current time matches the cron expression
    const minuteMatches = matchesCronPart(minutePart, minute, 0, 59);
    const hourMatches = matchesCronPart(hourPart, hour, 0, 23);
    const dayMatches = matchesCronPart(dayPart, day, 1, 31);
    const monthMatches = matchesCronPart(monthPart, month, 1, 12);
    const weekdayMatches = matchesCronPart(weekdayPart, weekday, 0, 6);

    if (minuteMatches && hourMatches && dayMatches && monthMatches && weekdayMatches) {
      return nextRun;
    }

    // Move to next minute
    nextRun.setMinutes(nextRun.getMinutes() + 1);
  }

  return null;
}

/**
 * Check if a value matches a cron part
 */
function matchesCronPart(part: string, value: number, min: number, max: number): boolean {
  // Wildcard matches everything
  if (part === "*") {
    return true;
  }

  // Step values (*/n)
  if (part.startsWith("*/")) {
    const step = parseInt(part.substring(2), 10);
    return value % step === 0;
  }

  // Comma-separated values
  if (part.includes(",")) {
    const values = part.split(",").map(v => parseInt(v, 10));
    return values.includes(value);
  }

  // Range (e.g., "1-5")
  if (part.includes("-")) {
    const [start, end] = part.split("-").map(v => parseInt(v, 10));
    return value >= start && value <= end;
  }

  // Specific value
  const specificValue = parseInt(part, 10);
  return !isNaN(specificValue) && value === specificValue;
}

/**
 * Get a human-readable description of a cron schedule
 */
export function getCronDescription(cronExpression: string): string {
  if (!cron.validate(cronExpression)) {
    return "Invalid cron expression";
  }

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length < 5) {
    return "Invalid cron expression";
  }

  const [minute, hour, day, month, weekday] = parts;

  // Common patterns
  if (cronExpression === "*/30 * * * *") {
    return "Every 30 minutes";
  }
  if (cronExpression === "*/15 * * * *") {
    return "Every 15 minutes";
  }
  if (cronExpression === "0 * * * *") {
    return "Every hour";
  }
  if (cronExpression === "0 */2 * * *") {
    return "Every 2 hours";
  }
  if (cronExpression === "0 */6 * * *") {
    return "Every 6 hours";
  }
  if (cronExpression === "0 3 * * *") {
    return "Daily at 3:00 AM";
  }
  if (cronExpression === "0 0 * * *") {
    return "Daily at midnight";
  }
  if (cronExpression === "0 0 * * 0") {
    return "Weekly on Sunday at midnight";
  }

  // Build description from parts
  let description = "";

  // Minute
  if (minute === "*") {
    description = "Every minute";
  } else if (minute.startsWith("*/")) {
    const step = minute.substring(2);
    description = `Every ${step} minutes`;
  } else {
    description = `At minute ${minute}`;
  }

  // Hour
  if (hour !== "*") {
    if (hour.startsWith("*/")) {
      const step = hour.substring(2);
      description += `, every ${step} hours`;
    } else {
      description += ` past hour ${hour}`;
    }
  }

  // Day
  if (day !== "*") {
    description += `, on day ${day}`;
  }

  // Month
  if (month !== "*") {
    const monthNames = ["", "January", "February", "March", "April", "May", "June", 
                        "July", "August", "September", "October", "November", "December"];
    const monthNum = parseInt(month, 10);
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
      description += `, in ${monthNames[monthNum]}`;
    }
  }

  // Weekday
  if (weekday !== "*") {
    const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const weekdayNum = parseInt(weekday, 10);
    if (!isNaN(weekdayNum) && weekdayNum >= 0 && weekdayNum <= 6) {
      description += `, on ${weekdayNames[weekdayNum]}`;
    }
  }

  return description;
}

/**
 * Get time until next run in a human-readable format
 */
export function getTimeUntilNextRun(nextRunTime: Date): string {
  const now = new Date();
  const diff = nextRunTime.getTime() - now.getTime();

  if (diff < 0) {
    return "Overdue";
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `in ${days} day${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `in ${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} min`;
  }
  if (minutes > 0) {
    return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  return `in ${seconds} second${seconds > 1 ? 's' : ''}`;
}

