/**
 * Date utilities for timezone-aware date handling
 * 
 * This module provides utilities to properly handle dates across timezones,
 * ensuring that article publication dates are displayed correctly regardless
 * of the user's timezone.
 * 
 * How timezone handling works:
 * 1. RSS feeds provide dates with timezone offsets (e.g., "20 Nov 2025 20:50:00 -0300")
 * 2. JavaScript Date constructor automatically converts these to UTC internally
 * 3. Prisma stores dates as UTC timestamps in PostgreSQL (using @db.Timestamptz)
 * 4. When displaying, toLocaleDateString/toLocaleString automatically converts
 *    from UTC to the user's browser timezone
 * 5. getTime() returns milliseconds since epoch (UTC), so time calculations are accurate
 */

/**
 * Format a date as a relative time string (e.g., "2h ago", "3d ago")
 * Handles both Date objects and ISO strings, properly accounting for timezones
 * 
 * @param date - Date to format (Date object, ISO string, or null)
 * @param fallbackDate - Optional fallback date if primary date is null
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
  date: Date | string | null,
  fallbackDate?: Date | string | null
): string {
  // Use fallback if primary date is null
  const dateToUse = date || fallbackDate;
  
  if (!dateToUse) {
    return "Unknown date";
  }

  // Parse date - handle both Date objects and ISO strings
  let parsedDate: Date;
  if (typeof dateToUse === "string") {
    parsedDate = new Date(dateToUse);
  } else {
    parsedDate = dateToUse;
  }

  // Validate date
  if (isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  // Calculate time difference in milliseconds
  // Use UTC time for both dates to avoid timezone issues
  const now = new Date();
  const diffMs = now.getTime() - parsedDate.getTime();
  
  // Handle future dates (shouldn't happen, but just in case)
  if (diffMs < 0) {
    return "Just now";
  }

  // Calculate time units
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // Format based on time difference
  if (diffSeconds < 60) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks}w ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths}mo ago`;
  } else {
    return `${diffYears}y ago`;
  }
}

/**
 * Format a date as a localized date string
 * Uses the user's locale and timezone
 * 
 * @param date - Date to format (Date object, ISO string, or null)
 * @param fallbackDate - Optional fallback date if primary date is null
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatLocalizedDate(
  date: Date | string | null,
  fallbackDate?: Date | string | null,
  options?: Intl.DateTimeFormatOptions
): string {
  // Use fallback if primary date is null
  const dateToUse = date || fallbackDate;
  
  if (!dateToUse) {
    return "Unknown date";
  }

  // Parse date
  let parsedDate: Date;
  if (typeof dateToUse === "string") {
    parsedDate = new Date(dateToUse);
  } else {
    parsedDate = dateToUse;
  }

  // Validate date
  if (isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  // Default options for a readable date format
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  return parsedDate.toLocaleDateString(undefined, defaultOptions);
}

/**
 * Format a date as a full localized date and time string
 * 
 * @param date - Date to format (Date object, ISO string, or null)
 * @param fallbackDate - Optional fallback date if primary date is null
 * @returns Formatted date and time string
 */
export function formatLocalizedDateTime(
  date: Date | string | null,
  fallbackDate?: Date | string | null
): string {
  // Use fallback if primary date is null
  const dateToUse = date || fallbackDate;
  
  if (!dateToUse) {
    return "Unknown date";
  }

  // Parse date
  let parsedDate: Date;
  if (typeof dateToUse === "string") {
    parsedDate = new Date(dateToUse);
  } else {
    parsedDate = dateToUse;
  }

  // Validate date
  if (isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  return parsedDate.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Convert a date to ISO string for use in datetime attributes
 * 
 * @param date - Date to convert (Date object, ISO string, or null)
 * @param fallbackDate - Optional fallback date if primary date is null
 * @returns ISO string or undefined
 */
export function toISOString(
  date: Date | string | null,
  fallbackDate?: Date | string | null
): string | undefined {
  // Use fallback if primary date is null
  const dateToUse = date || fallbackDate;
  
  if (!dateToUse) {
    return undefined;
  }

  // Parse date
  let parsedDate: Date;
  if (typeof dateToUse === "string") {
    parsedDate = new Date(dateToUse);
  } else {
    parsedDate = dateToUse;
  }

  // Validate date
  if (isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return parsedDate.toISOString();
}

/**
 * Get a smart date display that shows relative time for recent dates
 * and absolute date for older dates
 * 
 * @param date - Date to format (Date object, ISO string, or null)
 * @param fallbackDate - Optional fallback date if primary date is null
 * @param relativeThresholdDays - Number of days to show relative time (default: 7)
 * @returns Formatted date string
 */
export function formatSmartDate(
  date: Date | string | null,
  fallbackDate?: Date | string | null,
  relativeThresholdDays: number = 7
): string {
  // Use fallback if primary date is null
  const dateToUse = date || fallbackDate;
  
  if (!dateToUse) {
    return "Unknown date";
  }

  // Parse date
  let parsedDate: Date;
  if (typeof dateToUse === "string") {
    parsedDate = new Date(dateToUse);
  } else {
    parsedDate = dateToUse;
  }

  // Validate date
  if (isNaN(parsedDate.getTime())) {
    return "Unknown date";
  }

  // Calculate days difference
  const now = new Date();
  const diffMs = now.getTime() - parsedDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Show relative time for recent dates, absolute date for older ones
  if (diffDays < relativeThresholdDays) {
    return formatRelativeTime(parsedDate);
  } else {
    return formatLocalizedDate(parsedDate);
  }
}

