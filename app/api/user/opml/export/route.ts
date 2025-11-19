import { NextResponse } from "next/server";
import { getUserFeeds } from "@/lib/services/user-feed-service";
import { generateOPML } from "@/lib/services/opml-service";
import { opmlExportQuerySchema } from "@/lib/validations/opml-validation";
import { createHandler } from "@/lib/api-handler";
import type { FeedWithCategories } from "@/lib/services/opml-service";

/**
 * GET /api/user/opml/export
 * Export user's subscribed feeds as OPML file
 * Query params:
 * - categoryIds: string[] (optional) - Filter by category IDs
 * - feedIds: string[] (optional) - Filter by specific feed IDs
 */
export const GET = createHandler(
  async ({ query, session }) => {
    const userId = session.user.id;
    const { categoryIds, feedIds } = query;

    // Get user's subscribed feeds
    const userFeeds = await getUserFeeds(userId);

    // Extract feeds from subscriptions and include category information
    let feeds: FeedWithCategories[] = userFeeds.map((uf) => uf.feed as FeedWithCategories);

    // Filter by feedIds if provided
    if (feedIds && feedIds.length > 0) {
      feeds = feeds.filter((feed) => feedIds.includes(feed.id));
    }

    // Filter by categoryIds if provided
    if (categoryIds && categoryIds.length > 0) {
      feeds = feeds.filter((feed) =>
        feed.feedCategories?.some((fc) =>
          categoryIds.includes(fc.category.id)
        )
      );
    }

    if (feeds.length === 0) {
      return NextResponse.json(
        { error: "No feeds found matching the criteria" },
        { status: 404 }
      );
    }

    // Generate OPML
    const opmlXml = await generateOPML(feeds, {
      title: `${session.user.name || session.user.email}'s Feed Subscriptions`,
      ownerName: session.user.name || undefined,
      ownerEmail: session.user.email || undefined,
    });

    // Return as downloadable file
    const filename = `neureed-feeds-${new Date().toISOString().split("T")[0]}.opml`;

    return new NextResponse(opmlXml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  },
  {
    querySchema: opmlExportQuerySchema,
    requireAuth: true,
  }
);

