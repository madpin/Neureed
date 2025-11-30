/**
 * API Route: Saved Search Insights
 * GET /api/saved-searches/insights - Get performance insights for user's saved searches
 */

import { createHandler } from '@/lib/api-handler';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

interface SavedSearchInsight {
  id: string;
  name: string;
  icon: string;
  totalMatches: number;
  newMatchesLast24h: number;
  avgRelevanceScore: number;
  engagementRate: number;
  trend: 'up' | 'down' | 'stable';
  status: 'productive' | 'underperforming' | 'inactive';
  lastMatchedAt: string | null;
}

export const GET = createHandler(
  async ({ session }) => {
    const userId = session!.user.id;

    try {
      // Get all saved searches for the user
      const savedSearches = await prisma.saved_searches.findMany({
        where: {
          userId,
          archived: false,
        },
        include: {
          matches: {
            include: {
              article: {
                include: {
                  read_articles: {
                    where: { userId },
                  },
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      // Calculate insights for each search
      const insights: SavedSearchInsight[] = savedSearches.map((search) => {
        const matches = search.matches;
        const totalMatches = matches.length;

        // New matches in last 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const newMatchesLast24h = matches.filter(
          (m) => m.createdAt > yesterday
        ).length;

        // Average relevance score
        const avgRelevanceScore =
          totalMatches > 0
            ? matches.reduce((sum, m) => sum + m.relevanceScore, 0) / totalMatches
            : 0;

        // Engagement rate (percentage of matched articles that were read)
        const readArticles = matches.filter(
          (m) => m.article.read_articles.length > 0
        ).length;
        const engagementRate =
          totalMatches > 0 ? (readArticles / totalMatches) * 100 : 0;

        // Determine trend (simplified - in production, compare with previous period)
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (newMatchesLast24h > 5) {
          trend = 'up';
        } else if (newMatchesLast24h === 0 && totalMatches > 0) {
          trend = 'down';
        }

        // Determine status
        let status: 'productive' | 'underperforming' | 'inactive' = 'productive';
        if (totalMatches === 0 || !search.lastMatchedAt) {
          status = 'inactive';
        } else if (totalMatches < 5 || avgRelevanceScore < 0.5) {
          status = 'underperforming';
        }

        // Check if inactive (no matches in last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        if (search.lastMatchedAt && new Date(search.lastMatchedAt) < sevenDaysAgo) {
          status = 'inactive';
        }

        return {
          id: search.id,
          name: search.name,
          icon: search.icon || '🔍',
          totalMatches,
          newMatchesLast24h,
          avgRelevanceScore,
          engagementRate,
          trend,
          status,
          lastMatchedAt: search.lastMatchedAt?.toISOString() || null,
        };
      });

      // Calculate overall stats
      const stats = {
        totalSearches: savedSearches.length,
        activeSearches: insights.filter((i) => i.status !== 'inactive').length,
        totalMatches: insights.reduce((sum, i) => sum + i.totalMatches, 0),
        avgMatchesPerSearch:
          savedSearches.length > 0
            ? insights.reduce((sum, i) => sum + i.totalMatches, 0) /
              savedSearches.length
            : 0,
      };

      logger.info('Fetched saved search insights', {
        userId,
        totalSearches: stats.totalSearches,
        totalMatches: stats.totalMatches,
      });

      return {
        data: {
          insights,
          stats,
        },
      };
    } catch (error) {
      logger.error('Failed to fetch saved search insights', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });

      throw new Error('Failed to fetch insights');
    }
  },
  { requireAuth: true }
);
