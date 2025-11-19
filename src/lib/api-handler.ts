import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { apiResponse, apiError } from "@/lib/api-response";
import type { Session } from "next-auth";

/**
 * Context passed to API handlers
 */
export interface HandlerContext<TBody = any, TQuery = any> {
  body: TBody;
  query: TQuery;
  session: Session | null;
  params: Record<string, string>;
  request: NextRequest;
}

/**
 * Handler function type
 */
type Handler<TBody = any, TQuery = any, TResult = any> = (
  ctx: HandlerContext<TBody, TQuery>
) => Promise<TResult>;

/**
 * Options for createHandler
 */
export interface HandlerOptions<TBody = any, TQuery = any> {
  /**
   * Zod schema for validating request body (POST/PUT/PATCH)
   */
  bodySchema?: z.ZodSchema<TBody>;
  
  /**
   * Zod schema for validating query parameters (GET)
   */
  querySchema?: z.ZodSchema<TQuery>;
  
  /**
   * Whether authentication is required
   */
  requireAuth?: boolean;
}

/**
 * Parse and validate query parameters from URL
 */
function parseQueryParams<T>(
  request: NextRequest,
  schema?: z.ZodSchema<T>
): T | Record<string, string | null> {
  const { searchParams } = new URL(request.url);
  const queryObj: Record<string, string | null> = {};
  
  searchParams.forEach((value, key) => {
    queryObj[key] = value;
  });

  if (schema) {
    return schema.parse(queryObj);
  }

  return queryObj as T;
}

/**
 * Create a unified API route handler
 * 
 * This wrapper handles:
 * - Authentication (optional or required)
 * - Body validation (for POST/PUT/PATCH)
 * - Query parameter validation (for GET)
 * - URL params extraction
 * - Centralized error handling
 * - Consistent response format
 * 
 * @example
 * ```typescript
 * export const POST = createHandler(
 *   async ({ body, session }) => {
 *     return await createFeed(body, session.user.id);
 *   },
 *   { bodySchema: createFeedSchema, requireAuth: true }
 * );
 * ```
 */
export function createHandler<TBody = any, TQuery = any, TResult = any>(
  handler: Handler<TBody, TQuery, TResult>,
  options: HandlerOptions<TBody, TQuery> = {}
) {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> | Record<string, string> }
  ): Promise<NextResponse> => {
    try {
      // Get session
      const session = await auth();

      // Check authentication
      if (options.requireAuth && !session?.user) {
        return apiError("Unauthorized. Please sign in.", 401);
      }

      // Parse URL params (await if it's a Promise)
      let params: Record<string, string> = {};
      if (context?.params) {
        params = context.params instanceof Promise ? await context.params : context.params;
      }

      // Parse and validate body for non-GET/DELETE methods
      let body: TBody | null = null;
      const method = request.method.toUpperCase();
      
      if (method !== "GET" && method !== "DELETE") {
        try {
          const json = await request.json().catch(() => ({}));
          
          if (options.bodySchema) {
            const result = options.bodySchema.safeParse(json);
            if (!result.success) {
              return apiError(
                "Validation error",
                400,
                result.error.errors
              );
            }
            body = result.data;
          } else {
            body = json as TBody;
          }
        } catch (error) {
          // If JSON parsing fails and we have a body schema, that's an error
          if (options.bodySchema) {
            return apiError("Invalid JSON in request body", 400);
          }
        }
      }

      // Parse and validate query parameters
      let query: TQuery | Record<string, string | null>;
      try {
        query = parseQueryParams(request, options.querySchema);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return apiError(
            "Invalid query parameters",
            400,
            error.errors
          );
        }
        throw error;
      }

      // Call the handler
      const result = await handler({
        body: body as TBody,
        query: query as TQuery,
        session,
        params,
        request,
      });

      // Return successful response
      // If result is already a NextResponse, return it as-is
      if (result instanceof NextResponse) {
        return result;
      }
      
      return apiResponse(result);
    } catch (error) {
      // Centralized error logging
      console.error("API Error:", error);

      // Handle specific error types
      if (error instanceof Error) {
        // Check for common error patterns
        if (error.message.includes("Unauthorized")) {
          return apiError("Unauthorized", 401);
        }
        if (error.message.includes("not found") || error.message.includes("Not found")) {
          return apiError(error.message, 404);
        }
        if (error.message.includes("already exists") || error.message.includes("Unique constraint")) {
          return apiError(error.message, 409);
        }
        if (error.message.includes("Invalid") || error.message.includes("validation")) {
          return apiError(error.message, 400);
        }
        
        return apiError(error.message, 500);
      }

      return apiError("Internal server error", 500);
    }
  };
}

