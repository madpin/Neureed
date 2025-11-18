import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create categories
  const techCategory = await prisma.category.upsert({
    where: { name: "Technology" },
    update: {},
    create: {
      name: "Technology",
      description: "Tech news and articles",
    },
  });

  const aiCategory = await prisma.category.upsert({
    where: { name: "AI & Machine Learning" },
    update: {},
    create: {
      name: "AI & Machine Learning",
      description: "Artificial Intelligence and ML content",
    },
  });

  const webDevCategory = await prisma.category.upsert({
    where: { name: "Web Development" },
    update: {},
    create: {
      name: "Web Development",
      description: "Web development tutorials and news",
    },
  });

  console.log("✅ Categories created");

  // Create sample feeds
  const hackerNewsFeed = await prisma.feed.upsert({
    where: { url: "https://hnrss.org/frontpage" },
    update: {},
    create: {
      name: "Hacker News - Front Page",
      url: "https://hnrss.org/frontpage",
      settings: {
        refreshInterval: 3600,
      },
    },
  });

  const vercelBlogFeed = await prisma.feed.upsert({
    where: { url: "https://vercel.com/blog/rss.xml" },
    update: {},
    create: {
      name: "Vercel Blog",
      url: "https://vercel.com/blog/rss.xml",
      settings: {
        refreshInterval: 7200,
      },
    },
  });

  const openAIBlogFeed = await prisma.feed.upsert({
    where: { url: "https://openai.com/blog/rss.xml" },
    update: {},
    create: {
      name: "OpenAI Blog",
      url: "https://openai.com/blog/rss.xml",
      settings: {
        refreshInterval: 86400,
      },
    },
  });

  console.log("✅ Feeds created");

  // Associate feeds with categories
  await prisma.feedCategory.upsert({
    where: {
      feedId_categoryId: {
        feedId: hackerNewsFeed.id,
        categoryId: techCategory.id,
      },
    },
    update: {},
    create: {
      feedId: hackerNewsFeed.id,
      categoryId: techCategory.id,
    },
  });

  await prisma.feedCategory.upsert({
    where: {
      feedId_categoryId: {
        feedId: vercelBlogFeed.id,
        categoryId: webDevCategory.id,
      },
    },
    update: {},
    create: {
      feedId: vercelBlogFeed.id,
      categoryId: webDevCategory.id,
    },
  });

  await prisma.feedCategory.upsert({
    where: {
      feedId_categoryId: {
        feedId: openAIBlogFeed.id,
        categoryId: aiCategory.id,
      },
    },
    update: {},
    create: {
      feedId: openAIBlogFeed.id,
      categoryId: aiCategory.id,
    },
  });

  console.log("✅ Feed categories associated");

  // Create sample articles
  const sampleArticles = [
    {
      feedId: hackerNewsFeed.id,
      title: "Sample Tech Article",
      content: "This is a sample technology article for testing purposes.",
      url: "https://example.com/tech-article-1",
      publishedAt: new Date("2024-01-01"),
    },
    {
      feedId: vercelBlogFeed.id,
      title: "Next.js 15 Released",
      content: "Sample content about Next.js 15 features and improvements.",
      url: "https://example.com/nextjs-15",
      publishedAt: new Date("2024-01-02"),
    },
    {
      feedId: openAIBlogFeed.id,
      title: "Advances in AI Research",
      content: "Sample content about recent advances in artificial intelligence.",
      url: "https://example.com/ai-research",
      publishedAt: new Date("2024-01-03"),
    },
  ];

  for (const article of sampleArticles) {
    await prisma.article.upsert({
      where: { url: article.url },
      update: {},
      create: article,
    });
  }

  console.log("✅ Sample articles created");

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: "test@neureed.com" },
    update: {},
    create: {
      email: "test@neureed.com",
      name: "Test User",
      emailVerified: new Date(),
    },
  });

  console.log("✅ Test user created");

  // Create user preferences
  await prisma.userPreferences.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      theme: "system",
      fontSize: "medium",
      articlesPerPage: 20,
      defaultView: "expanded",
      showReadArticles: true,
      autoMarkAsRead: false,
      showRelatedExcerpts: false,
    },
  });

  console.log("✅ User preferences created");

  // Subscribe test user to feeds
  await prisma.userFeed.upsert({
    where: {
      userId_feedId: {
        userId: testUser.id,
        feedId: hackerNewsFeed.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      feedId: hackerNewsFeed.id,
    },
  });

  await prisma.userFeed.upsert({
    where: {
      userId_feedId: {
        userId: testUser.id,
        feedId: vercelBlogFeed.id,
      },
    },
    update: {},
    create: {
      userId: testUser.id,
      feedId: vercelBlogFeed.id,
      customName: "Vercel Updates",
    },
  });

  console.log("✅ User feed subscriptions created");

  // Mark some articles as read for the test user
  const articles = await prisma.article.findMany({
    take: 2,
  });

  for (const article of articles) {
    await prisma.readArticle.upsert({
      where: {
        userId_articleId: {
          userId: testUser.id,
          articleId: article.id,
        },
      },
      update: {},
      create: {
        userId: testUser.id,
        articleId: article.id,
      },
    });
  }

  console.log("✅ Read articles created");
  console.log("🎉 Database seed completed successfully!");
  console.log("\n📝 Test User Credentials:");
  console.log("   Email: test@neureed.com");
  console.log("   Note: Use OAuth providers to sign in (Google/GitHub)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error during seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });

