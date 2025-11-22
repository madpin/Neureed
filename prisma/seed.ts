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

  const newsCategory = await prisma.categories.upsert({
    where: { name: "News" },
    update: {},
    create: {
      id: "cat_news_001",
      name: "News",
      description: "General news content",
      updatedAt: new Date(),
    },
  });

  const scienceCategory = await prisma.categories.upsert({
    where: { name: "Science" },
    update: {},
    create: {
      id: "cat_science_001",
      name: "Science",
      description: "Science and research content",
      updatedAt: new Date(),
    },
  });

  const positiveNewsCategory = await prisma.categories.upsert({
    where: { name: "Positive News" },
    update: {},
    create: {
      id: "cat_positive_001",
      name: "Positive News",
      description: "Uplifting and positive news stories",
      updatedAt: new Date(),
    },
  });

  const satireCategory = await prisma.categories.upsert({
    where: { name: "Satire" },
    update: {},
    create: {
      id: "cat_satire_001",
      name: "Satire",
      description: "Satirical news and comedy",
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

  // Create default feeds that all new users will be subscribed to
  const techCrunchFeed = await prisma.feeds.upsert({
    where: { url: "https://techcrunch.com/feed" },
    update: {},
    create: {
      id: "feed_techcrunch_001",
      name: "TechCrunch",
      url: "https://techcrunch.com/feed",
      settings: {
        refreshInterval: 3600,
      },
      updatedAt: new Date(),
    },
  });

  const vergeFeed = await prisma.feeds.upsert({
    where: { url: "https://www.theverge.com/rss/index.xml" },
    update: {},
    create: {
      id: "feed_verge_001",
      name: "The Verge",
      url: "https://www.theverge.com/rss/index.xml",
      settings: {
        refreshInterval: 3600,
      },
      updatedAt: new Date(),
    },
  });

  const hackerNewsFeed = await prisma.feeds.upsert({
    where: { url: "https://hnrss.org/frontpage" },
    update: {},
    create: {
      id: "feed_hn_001",
      name: "Hacker News",
      url: "https://hnrss.org/frontpage",
      settings: {
        refreshInterval: 3600,
      },
      updatedAt: new Date(),
    },
  });

  const bbcNewsFeed = await prisma.feeds.upsert({
    where: { url: "https://feeds.bbci.co.uk/news/rss.xml" },
    update: {},
    create: {
      id: "feed_bbc_001",
      name: "BBC News",
      url: "https://feeds.bbci.co.uk/news/rss.xml",
      settings: {
        refreshInterval: 1800, // 30 minutes for news
      },
      updatedAt: new Date(),
    },
  });

  const natureFeed = await prisma.feeds.upsert({
    where: { url: "https://www.nature.com/nature.rss" },
    update: {},
    create: {
      id: "feed_nature_001",
      name: "Nature",
      url: "https://www.nature.com/nature.rss",
      settings: {
        refreshInterval: 7200, // 2 hours for science journals
      },
      updatedAt: new Date(),
    },
  });

  const scienceDailyFeed = await prisma.feeds.upsert({
    where: { url: "https://www.sciencedaily.com/rss/all.xml" },
    update: {},
    create: {
      id: "feed_sciencedaily_001",
      name: "Science Daily",
      url: "https://www.sciencedaily.com/rss/all.xml",
      settings: {
        refreshInterval: 7200,
      },
      updatedAt: new Date(),
    },
  });

  const goodNewsNetworkFeed = await prisma.feeds.upsert({
    where: { url: "https://www.goodnewsnetwork.org/feed" },
    update: {},
    create: {
      id: "feed_goodnews_001",
      name: "Good News Network",
      url: "https://www.goodnewsnetwork.org/feed",
      settings: {
        refreshInterval: 7200,
      },
      updatedAt: new Date(),
    },
  });

  const positiveNewsFeed = await prisma.feeds.upsert({
    where: { url: "https://www.positive.news/feed" },
    update: {},
    create: {
      id: "feed_positivenews_001",
      name: "Positive News",
      url: "https://www.positive.news/feed",
      settings: {
        refreshInterval: 7200,
      },
      updatedAt: new Date(),
    },
  });

  const onionFeed = await prisma.feeds.upsert({
    where: { url: "https://www.theonion.com/rss" },
    update: {},
    create: {
      id: "feed_onion_001",
      name: "The Onion",
      url: "https://www.theonion.com/rss",
      settings: {
        refreshInterval: 3600,
      },
      updatedAt: new Date(),
    },
  });

  // Additional sample feeds for variety
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
  // Technology feeds
  await prisma.feed_categories.upsert({
    where: {
      feedId_categoryId: {
        feedId: techCrunchFeed.id,
        categoryId: techCategory.id,
      },
    },
    update: {},
    create: {
      feedId: techCrunchFeed.id,
      categoryId: techCategory.id,
    },
  });

  await prisma.feed_categories.upsert({
    where: {
      feedId_categoryId: {
        feedId: vergeFeed.id,
        categoryId: techCategory.id,
      },
    },
    update: {},
    create: {
      feedId: vergeFeed.id,
      categoryId: techCategory.id,
    },
  });

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

  // News feeds
  await prisma.feed_categories.upsert({
    where: {
      feedId_categoryId: {
        feedId: bbcNewsFeed.id,
        categoryId: newsCategory.id,
      },
    },
    update: {},
    create: {
      feedId: bbcNewsFeed.id,
      categoryId: newsCategory.id,
    },
  });

  // Science feeds
  await prisma.feed_categories.upsert({
    where: {
      feedId_categoryId: {
        feedId: natureFeed.id,
        categoryId: scienceCategory.id,
      },
    },
    update: {},
    create: {
      feedId: natureFeed.id,
      categoryId: scienceCategory.id,
    },
  });

  await prisma.feed_categories.upsert({
    where: {
      feedId_categoryId: {
        feedId: scienceDailyFeed.id,
        categoryId: scienceCategory.id,
      },
    },
    update: {},
    create: {
      feedId: scienceDailyFeed.id,
      categoryId: scienceCategory.id,
    },
  });

  // Positive News feeds
  await prisma.feed_categories.upsert({
    where: {
      feedId_categoryId: {
        feedId: goodNewsNetworkFeed.id,
        categoryId: positiveNewsCategory.id,
      },
    },
    update: {},
    create: {
      feedId: goodNewsNetworkFeed.id,
      categoryId: positiveNewsCategory.id,
    },
  });

  await prisma.feed_categories.upsert({
    where: {
      feedId_categoryId: {
        feedId: positiveNewsFeed.id,
        categoryId: positiveNewsCategory.id,
      },
    },
    update: {},
    create: {
      feedId: positiveNewsFeed.id,
      categoryId: positiveNewsCategory.id,
    },
  });

  // Satire feeds
  await prisma.feed_categories.upsert({
    where: {
      feedId_categoryId: {
        feedId: onionFeed.id,
        categoryId: satireCategory.id,
      },
    },
    update: {},
    create: {
      feedId: onionFeed.id,
      categoryId: satireCategory.id,
    },
  });

  // Additional feeds
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
      title: "Sample Tech Article from Hacker News",
      content: "This is a sample technology article for testing purposes from Hacker News.",
      url: "https://example.com/tech-article-hn",
      publishedAt: new Date("2024-01-01"),
      updatedAt: new Date(),
    },
    {
      id: "art_002",
      feedId: techCrunchFeed.id,
      title: "Startup Raises $50M in Series A",
      content: "Sample content about a tech startup raising funding.",
      url: "https://example.com/startup-funding",
      publishedAt: new Date("2024-01-02"),
      updatedAt: new Date(),
    },
    {
      id: "art_003",
      feedId: bbcNewsFeed.id,
      title: "Breaking News: Global Summit Announced",
      content: "Sample content about international news.",
      url: "https://example.com/global-summit",
      publishedAt: new Date("2024-01-03"),
      updatedAt: new Date(),
    },
    {
      id: "art_004",
      feedId: natureFeed.id,
      title: "New Discovery in Quantum Physics",
      content: "Sample content about scientific breakthrough.",
      url: "https://example.com/quantum-discovery",
      publishedAt: new Date("2024-01-04"),
      updatedAt: new Date(),
    },
    {
      id: "art_005",
      feedId: goodNewsNetworkFeed.id,
      title: "Community Comes Together to Help Local Charity",
      content: "Sample content about positive community action.",
      url: "https://example.com/community-help",
      publishedAt: new Date("2024-01-05"),
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

