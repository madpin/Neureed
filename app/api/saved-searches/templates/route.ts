/**
 * API Route: Search Templates
 * GET /api/saved-searches/templates - List all templates or search by category/keyword
 */

import { createHandler } from '@/lib/api-handler';
import { apiError } from '@/lib/api-response';
import { z } from 'zod';
import {
  getAllTemplates,
  getTemplatesByCategory,
  searchTemplates,
  getTemplateCategories,
  getPopularTemplates,
  suggestTemplates,
  getTemplateById,
} from '@/lib/services/search-templates-service';

export const dynamic = "force-dynamic";

const querySchema = z.object({
  category: z.enum(['technology', 'news', 'research', 'jobs', 'custom']).optional(),
  keyword: z.string().optional(),
  popular: z.enum(['true', 'false']).optional(),
  suggest: z.enum(['true', 'false']).optional(),
  categories: z.enum(['true', 'false']).optional(),
  id: z.string().optional(),
});

export const GET = createHandler(
  async ({ query, session }) => {
    const { category, keyword, popular, suggest, categories, id } = query;

    // Get specific template by ID
    if (id) {
      const template = getTemplateById(id);
      if (!template) {
        return apiError('Template not found', 404);
      }
      return { data: template };
    }

    // Get template categories
    if (categories === 'true') {
      const categoryList = getTemplateCategories();
      return { data: categoryList };
    }

    // Get popular templates
    if (popular === 'true') {
      const templates = getPopularTemplates(10);
      return { data: templates };
    }

    // Get suggested templates based on user's feeds
    if (suggest === 'true' && session?.user.id) {
      // In a real implementation, we would fetch user's feed topics
      // For now, return popular templates
      const templates = getPopularTemplates();
      return { data: templates };
    }

    // Search by keyword
    if (keyword) {
      const templates = searchTemplates(keyword);
      return { data: templates };
    }

    // Filter by category
    if (category) {
      const templates = getTemplatesByCategory(category);
      return { data: templates };
    }

    // Return all templates
    const templates = getAllTemplates();
    return { data: templates };
  },
  { querySchema }
);
