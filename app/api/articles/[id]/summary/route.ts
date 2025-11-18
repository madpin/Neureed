/**
 * Article Summary API
 * GET /api/articles/[id]/summary - Get article summary
 */

import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { summarizeArticle } from "@/src/lib/services/summarization-service";
import { getCurrentUser } from "@/src/lib/middleware/auth-middleware";

/**
 * GET /api/articles/[id]/summary
 * Get article summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;

    const user = await getCurrentUser();
    const summary = await summarizeArticle(articleId, {
      userId: user?.id,
    });

    return apiResponse({ summary });
  } catch (error) {
    console.error("Error generating article summary:", error);
    
    // Provide more helpful error messages
    let errorMessage = "Failed to generate summary";
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error types
      if (error.message.includes("API key")) {
        statusCode = 503; // Service Unavailable
        errorMessage = "LLM service not configured. Please set up your OpenAI API key in preferences or environment variables.";
      } else if (error.message.includes("Article not found")) {
        statusCode = 404;
      } else if (error.message.includes("OpenAI API error")) {
        statusCode = 502; // Bad Gateway
        errorMessage = "LLM service error: " + error.message;
      }
    }
    
    return apiError(errorMessage, statusCode);
  }
}

