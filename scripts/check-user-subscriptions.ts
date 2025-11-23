import { prisma } from "../src/lib/db";


async function main() {
  // Get all users
  const users = await prisma.user.findMany();
  console.log(`\nTotal users: ${users.length}\n`);

  if (users.length === 0) {
    console.log("⚠️  NO USERS FOUND - This is the problem!");
    console.log("The cron job found feeds to refresh, but no users are subscribed.");
    console.log("Articles are being created but not associated with any user.");
    return;
  }

  for (const user of users) {
    console.log(`User: ${user.email || user.id}`);
    
    // Get user's feed subscriptions
    const userFeeds = await prisma.user_feeds.findMany({
      where: { userId: user.id },
      include: { feeds: true },
    });

    console.log(`  Subscribed to ${userFeeds.length} feeds:`);
    
    if (userFeeds.length === 0) {
      console.log("  ⚠️  User has no feed subscriptions!");
    } else {
      userFeeds.forEach(uf => {
        console.log(`  - ${uf.feeds.url}`);
      });
    }
    console.log();
  }

  // Check the feed that was just refreshed
  const folhaFeed = await prisma.feeds.findFirst({
    where: {
      url: { contains: "folha" },
    },
    include: {
      user_feeds: true,
    },
  });

  if (folhaFeed) {
    console.log(`\nFolha feed status:`);
    console.log(`  URL: ${folhaFeed.url}`);
    console.log(`  User subscriptions: ${folhaFeed.user_feeds.length}`);
    
    if (folhaFeed.user_feeds.length === 0) {
      console.log(`  ⚠️  NO USERS SUBSCRIBED TO THIS FEED!`);
      console.log(`  This is why you can't see the articles.`);
    }
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

