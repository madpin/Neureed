/**
 * API Client Utilities
 *
 * This file provides a consistent interface for making API calls throughout the application.
 * All API calls should use these utilities for consistency and error handling.
 */

/**
 * Base API error class with additional context
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * API response type from our backend
 */
interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || data.message || "An error occurred",
      response.status,
      data.details
    );
  }

  // Return the data field if it exists, otherwise return the whole response
  return (data.data ?? data) as T;
}

/**
 * GET request
 */
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const urlWithParams = searchParams.toString()
    ? `${url}?${searchParams.toString()}`
    : url;

  return fetchApi<T>(urlWithParams, { method: "GET" });
}

/**
 * POST request
 */
export async function apiPost<T>(
  url: string,
  body?: unknown
): Promise<T> {
  return fetchApi<T>(url, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export async function apiPut<T>(
  url: string,
  body?: unknown
): Promise<T> {
  return fetchApi<T>(url, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T>(
  url: string,
  body?: unknown
): Promise<T> {
  return fetchApi<T>(url, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T>(url: string): Promise<T> {
  return fetchApi<T>(url, { method: "DELETE" });
}

/**
 * Helper to build API URLs
 */
export function buildApiUrl(path: string, params?: Record<string, unknown>): string {
  const url = path.startsWith("/api") ? path : `/api${path}`;

  if (!params) return url;

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString() ? `${url}?${searchParams.toString()}` : url;
}
