import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create categories
  const techCategory = await prisma.categories.upsert({
    where: { name: "Technology" },
    update: {},
    create: {
      id: "cat_tech_001",
      name: "Technology",
      description: "Tech news and articles",
      updatedAt: new Date(),
    },
  });

  const aiCategory = await prisma.categories.upsert({
    where: { name: "AI & Machine Learning" },
    update: {},
    create: {
      id: "cat_ai_001",
      name: "AI & Machine Learning",
      description: "Artificial Intelligence and ML content",
      updatedAt: new Date(),
    },
  });

  const webDevCategory = await prisma.categories.upsert({
    where: { name: "Web Development" },
    update: {},
    create: {
      id: "cat_webdev_001",
      name: "Web Development",
      description: "Web development tutorials and news",
      updatedAt: new Date(),
    },
  });

  console.log("✅ Categories created");

  // Create sample feeds
  const hackerNewsFeed = await prisma.feeds.upsert({
    where: { url: "https://hnrss.org/frontpage" },
    update: {},
    create: {
      id: "feed_hn_001",
      name: "Hacker News - Front Page",
      url: "https://hnrss.org/frontpage",
      settings: {
        refreshInterval: 3600,
      },
      updatedAt: new Date(),
    },
  });

  const vercelBlogFeed = await prisma.feeds.upsert({
    where: { url: "https://vercel.com/blog/rss.xml" },
    update: {},
    create: {
      id: "feed_vercel_001",
      name: "Vercel Blog",
      url: "https://vercel.com/blog/rss.xml",
      settings: {
        refreshInterval: 7200,
      },
      updatedAt: new Date(),
    },
  });

  const openAIBlogFeed = await prisma.feeds.upsert({
    where: { url: "https://openai.com/blog/rss.xml" },
    update: {},
    create: {
      id: "feed_openai_001",
      name: "OpenAI Blog",
      url: "https://openai.com/blog/rss.xml",
      settings: {
        refreshInterval: 86400,
      },
      updatedAt: new Date(),
    },
  });

  console.log("✅ Feeds created");

  // Associate feeds with categories
  await prisma.feed_categories.upsert({
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

  await prisma.feed_categories.upsert({
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

  await prisma.feed_categories.upsert({
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
      id: "art_001",
      feedId: hackerNewsFeed.id,
      title: "Sample Tech Article",
      content: "This is a sample technology article for testing purposes.",
      url: "https://example.com/tech-article-1",
      publishedAt: new Date("2024-01-01"),
      updatedAt: new Date(),
    },
    {
      id: "art_002",
      feedId: vercelBlogFeed.id,
      title: "Next.js 15 Released",
      content: "Sample content about Next.js 15 features and improvements.",
      url: "https://example.com/nextjs-15",
      publishedAt: new Date("2024-01-02"),
      updatedAt: new Date(),
    },
    {
      id: "art_003",
      feedId: openAIBlogFeed.id,
      title: "Advances in AI Research",
      content: "Sample content about recent advances in artificial intelligence.",
      url: "https://example.com/ai-research",
      publishedAt: new Date("2024-01-03"),
      updatedAt: new Date(),
    },
  ];

  for (const article of sampleArticles) {
    await prisma.articles.upsert({
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
      id: "user_test_001",
      email: "test@neureed.com",
      name: "Test User",
      emailVerified: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log("✅ Test user created");

  // Create user preferences
  await prisma.user_preferences.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      id: "pref_test_001",
      userId: testUser.id,
      theme: "system",
      fontSize: "medium",
      articlesPerPage: 20,
      defaultView: "expanded",
      showReadArticles: true,
      autoMarkAsRead: false,
      showRelatedExcerpts: false,
      updatedAt: new Date(),
    },
  });

  console.log("✅ User preferences created");

  // Subscribe test user to feeds
  await prisma.user_feeds.upsert({
    where: {
      userId_feedId: {
        userId: testUser.id,
        feedId: hackerNewsFeed.id,
      },
    },
    update: {},
    create: {
      id: "userfeed_001",
      userId: testUser.id,
      feedId: hackerNewsFeed.id,
      updatedAt: new Date(),
    },
  });

  await prisma.user_feeds.upsert({
    where: {
      userId_feedId: {
        userId: testUser.id,
        feedId: vercelBlogFeed.id,
      },
    },
    update: {},
    create: {
      id: "userfeed_002",
      userId: testUser.id,
      feedId: vercelBlogFeed.id,
      customName: "Vercel Updates",
      updatedAt: new Date(),
    },
  });

  console.log("✅ User feed subscriptions created");

  // Mark some articles as read for the test user
  const articles = await prisma.articles.findMany({
    take: 2,
  });

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    await prisma.read_articles.upsert({
      where: {
        userId_articleId: {
          userId: testUser.id,
          articleId: article.id,
        },
      },
      update: {},
      create: {
        id: `read_art_${i + 1}`,
        userId: testUser.id,
        articleId: article.id,
      },
    });
  }

  console.log("✅ Read articles created");

  // Create admin settings
  await prisma.admin_settings.upsert({
    where: { key: "embedding_auto_generate" },
    update: {},
    create: {
      id: "admin_setting_001",
      key: "embedding_auto_generate",
      value: false,
      description: "Automatically generate embeddings when importing feed articles",
      updatedAt: new Date(),
    },
  });

  console.log("✅ Admin settings created");
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

