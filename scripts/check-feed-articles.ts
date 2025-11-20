import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const feeds = await prisma.feeds.findMany({
    include: {
      _count: {
        select: { articles: true },
      },
    },
  });

  console.log("\nFeed Article Counts:\n");
  
  for (const feed of feeds) {
    console.log(`Feed: ${feed.title || feed.url}`);
    console.log(`  Articles: ${feed._count.articles}`);
    console.log(`  Last fetched: ${feed.lastFetched}`);
    console.log(`  Error count: ${feed.errorCount}`);
    
    // Check if over limit
    if (feed._count.articles >= 500) {
      console.log(`  ⚠️  OVER 500 ARTICLE LIMIT!`);
    }
    console.log();
  }

  // Check total articles
  const totalArticles = await prisma.articles.count();
  console.log(`\nTotal articles in database: ${totalArticles}`);
  
  // Check recent articles
  const recentArticles = await prisma.articles.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      createdAt: true,
      publishedAt: true,
      feedId: true,
    },
  });
  
  console.log(`\n5 Most Recently Created Articles:\n`);
  recentArticles.forEach(article => {
    console.log(`- ${article.title}`);
    console.log(`  Created: ${article.createdAt}`);
    console.log(`  Published: ${article.publishedAt}`);
    console.log(`  Feed: ${article.feedId}`);
    console.log();
  });
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

