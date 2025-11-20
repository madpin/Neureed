import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Get the Folha feed
  const folhaFeed = await prisma.feeds.findFirst({
    where: {
      url: { contains: "folha" },
    },
  });

  if (!folhaFeed) {
    console.log("Feed not found");
    return;
  }

  console.log(`\nChecking feed: ${folhaFeed.url}`);
  console.log(`Last fetched: ${folhaFeed.lastFetched}\n`);

  // Get the 10 most recent articles by createdAt
  const recentByCreated = await prisma.articles.findMany({
    where: { feedId: folhaFeed.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      createdAt: true,
      publishedAt: true,
    },
  });

  console.log("10 Most Recent Articles (by createdAt):");
  recentByCreated.forEach((article, idx) => {
    const age = Math.floor((Date.now() - article.createdAt.getTime()) / 1000 / 60);
    console.log(`${idx + 1}. ${article.title}`);
    console.log(`   Created: ${article.createdAt.toISOString()} (${age} minutes ago)`);
    console.log(`   Published: ${article.publishedAt?.toISOString() || 'N/A'}`);
    console.log();
  });

  // Count articles created in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.articles.count({
    where: {
      feedId: folhaFeed.id,
      createdAt: { gte: oneHourAgo },
    },
  });

  console.log(`\nArticles created in the last hour: ${recentCount}`);

  // Total count
  const total = await prisma.articles.count({
    where: { feedId: folhaFeed.id },
  });
  
  console.log(`Total articles in feed: ${total}`);
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

