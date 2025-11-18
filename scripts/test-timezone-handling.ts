/**
 * Test script to verify timezone handling for article dates
 * 
 * This script tests that article dates are properly handled across different timezones,
 * specifically addressing the Brazilian timezone issue (UTC-3).
 */

import { formatRelativeTime, formatLocalizedDate, formatSmartDate, toISOString } from "../src/lib/date-utils";

console.log("=== Testing Timezone Handling ===\n");

// Test 1: Recent article (2 hours ago)
const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
console.log("Test 1: Article from 2 hours ago");
console.log("  UTC Time:", twoHoursAgo.toISOString());
console.log("  Relative:", formatRelativeTime(twoHoursAgo));
console.log("  Localized:", formatLocalizedDate(twoHoursAgo));
console.log("  Smart:", formatSmartDate(twoHoursAgo));
console.log();

// Test 2: Article from yesterday
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
console.log("Test 2: Article from yesterday");
console.log("  UTC Time:", yesterday.toISOString());
console.log("  Relative:", formatRelativeTime(yesterday));
console.log("  Localized:", formatLocalizedDate(yesterday));
console.log("  Smart:", formatSmartDate(yesterday));
console.log();

// Test 3: Article from 5 days ago
const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
console.log("Test 3: Article from 5 days ago");
console.log("  UTC Time:", fiveDaysAgo.toISOString());
console.log("  Relative:", formatRelativeTime(fiveDaysAgo));
console.log("  Localized:", formatLocalizedDate(fiveDaysAgo));
console.log("  Smart:", formatSmartDate(fiveDaysAgo));
console.log();

// Test 4: Article from 2 weeks ago
const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
console.log("Test 4: Article from 2 weeks ago");
console.log("  UTC Time:", twoWeeksAgo.toISOString());
console.log("  Relative:", formatRelativeTime(twoWeeksAgo));
console.log("  Localized:", formatLocalizedDate(twoWeeksAgo));
console.log("  Smart:", formatSmartDate(twoWeeksAgo));
console.log();

// Test 5: ISO string from database (simulating Brazilian timezone scenario)
const isoString = "2025-11-18T12:00:00.000Z"; // Noon UTC
console.log("Test 5: ISO string from database (Noon UTC)");
console.log("  ISO String:", isoString);
console.log("  Relative:", formatRelativeTime(isoString));
console.log("  Localized:", formatLocalizedDate(isoString));
console.log("  Smart:", formatSmartDate(isoString));
console.log();

// Test 6: Null date with fallback
const fallbackDate = new Date();
console.log("Test 6: Null date with fallback to current time");
console.log("  Primary: null");
console.log("  Fallback:", fallbackDate.toISOString());
console.log("  Relative:", formatRelativeTime(null, fallbackDate));
console.log("  Localized:", formatLocalizedDate(null, fallbackDate));
console.log("  Smart:", formatSmartDate(null, fallbackDate));
console.log();

// Test 7: Null date without fallback
console.log("Test 7: Null date without fallback");
console.log("  Relative:", formatRelativeTime(null));
console.log("  Localized:", formatLocalizedDate(null));
console.log("  Smart:", formatSmartDate(null));
console.log();

// Test 8: ISO String conversion
console.log("Test 8: ISO String conversion for datetime attributes");
console.log("  Valid date:", toISOString(twoHoursAgo));
console.log("  ISO string:", toISOString(isoString));
console.log("  Null date:", toISOString(null));
console.log("  With fallback:", toISOString(null, fallbackDate));
console.log();

console.log("=== Timezone Information ===");
console.log("Current timezone offset:", new Date().getTimezoneOffset() / -60, "hours from UTC");
console.log("Current locale:", Intl.DateTimeFormat().resolvedOptions().locale);
console.log("Current timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log();

console.log("=== Brazilian Timezone Simulation ===");
console.log("If you're in Brazil (UTC-3), a date stored as '2025-11-18T15:00:00.000Z' (3pm UTC)");
console.log("should display as '12:00 PM' local time (noon in Brazil).");
console.log("The relative time should be calculated correctly without the 3-hour offset issue.");
const brazilTestDate = new Date("2025-11-18T15:00:00.000Z");
console.log("  UTC Time:", brazilTestDate.toISOString());
console.log("  Local Time:", brazilTestDate.toLocaleString());
console.log("  Formatted:", formatLocalizedDate(brazilTestDate));
console.log();

console.log("✅ All tests completed!");
console.log("The date utilities now properly handle timezones by:");
console.log("  1. Using getTime() for time differences (always in UTC)");
console.log("  2. Using toLocaleDateString/toLocaleString for display (user's timezone)");
console.log("  3. Providing fallback to createdAt or current time for missing dates");

