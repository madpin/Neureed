import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get the user
  const user = await prisma.user.findFirst();
  
  if (!user) {
    console.log("No user found");
    return;
  }

  // Get user's subscribed feeds
  const userFeeds = await prisma.user_feeds.findMany({
    where: { userId: user.id },
    select: { feedId: true },
  });

  const feedIds = userFeeds.map((uf) => uf.feedId);

  console.log(`\nUser subscribed to ${feedIds.length} feeds`);

  // Get the 20 most recent articles by publishedAt (what the homepage shows)
  const recentArticles = await prisma.articles.findMany({
    where: {
      feedId: { in: feedIds },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 20,
    select: {
      id: true,
      title: true,
      publishedAt: true,
      createdAt: true,
      feedId: true,
      feeds: {
        select: {
          url: true,
        },
      },
    },
  });

  console.log(`\n📰 Top 20 Articles (sorted by publishedAt DESC - what you see on homepage):\n`);

  recentArticles.forEach((article, idx) => {
    const isNew = Date.now() - article.createdAt.getTime() < 60 * 60 * 1000; // Created in last hour
    const isFolha = article.feeds.url.includes("folha");
    
    console.log(`${idx + 1}. ${isNew ? "🆕" : "  "} ${isFolha ? "📰" : "  "} ${article.title.substring(0, 80)}`);
    console.log(`   Published: ${article.publishedAt?.toISOString() || "N/A"}`);
    console.log(`   Created: ${article.createdAt.toISOString()}`);
    console.log(`   Feed: ${article.feeds.url.substring(0, 50)}...`);
    console.log();
  });

  // Check the Folha articles specifically
  const folhaFeed = await prisma.feeds.findFirst({
    where: { url: { contains: "folha" } },
  });

  if (folhaFeed) {
    const folhaArticles = await prisma.articles.findMany({
      where: {
        feedId: folhaFeed.id,
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: {
        title: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    console.log(`\n📰 Folha articles from last refresh (${folhaArticles.length} articles):\n`);
    folhaArticles.forEach((article, idx) => {
      console.log(`${idx + 1}. ${article.title}`);
      console.log(`   Published: ${article.publishedAt?.toISOString()}`);
      console.log();
    });
  }
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

