import { NextResponse } from "next/server";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: unknown;
};

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Create an error API response
 */
export function errorResponse(
  error: string,
  status: number = 500,
  details?: unknown
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error,
  };
  
  if (details !== undefined) {
    response.details = details;
  }

  return NextResponse.json(response, { status });
}

/**
 * Create a validation error response
 */
export function validationErrorResponse(
  error: string
): NextResponse<ApiResponse> {
  return errorResponse(error, 400);
}

/**
 * Create a not found error response
 */
export function notFoundResponse(
  resource: string = "Resource"
): NextResponse<ApiResponse> {
  return errorResponse(`${resource} not found`, 404);
}

/**
 * Create an unauthorized error response
 */
export function unauthorizedResponse(
  message: string = "Unauthorized"
): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error("API Error:", error);

  if (error instanceof Error) {
    return errorResponse(error.message);
  }

  return errorResponse("An unexpected error occurred");
}

/**
 * Alias for successResponse (for convenience)
 */
export function apiResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return successResponse(data, undefined, status);
}

/**
 * Alias for errorResponse (for convenience)
 * Can be called as:
 * - apiError(message, status)
 * - apiError(message, status, details)
 */
export function apiError(
  error: string,
  statusOrDetails?: number | unknown,
  details?: unknown
): NextResponse<ApiResponse> {
  let status = 500;
  let errorDetails = details;

  // If second param is a number, it's the status code
  if (typeof statusOrDetails === "number") {
    status = statusOrDetails;
  } else {
    // Otherwise it's the details
    errorDetails = statusOrDetails;
  }

  if (errorDetails) {
    console.error("API Error Details:", errorDetails);
  }
  
  return errorResponse(error, status, errorDetails);
}

