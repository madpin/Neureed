/**
 * Test the article API to see if sorting now works correctly
 */

async function runTest() {
  console.log("\n🧪 Testing article API sorting fix...\n");

  // Simulate API call
  const response = await fetch("http://localhost:3000/api/articles?page=1&limit=10");
  const data = await response.json();

  const articles = data.data?.articles || data.articles || [];

  console.log(`📄 First 10 articles (should now show articles with dates):\n`);

  articles.forEach((article: any, idx: number) => {
    const hasDate = article.publishedAt !== null;
    const isFolha = article.feeds?.url?.includes("folha");
    
    console.log(`${idx + 1}. ${hasDate ? "📅" : "❌"} ${isFolha ? "📰" : "  "} ${article.title.substring(0, 70)}`);
    console.log(`   Published: ${article.publishedAt || "NULL"}`);
    console.log(`   Feed: ${article.feeds?.url?.substring(0, 50) || "unknown"}`);
    console.log();
  });

  // Check if any are from Folha
  const folhaCount = articles.filter((a: any) => a.feeds?.url?.includes("folha")).length;
  
  if (folhaCount > 0) {
    console.log(`✅ SUCCESS! Found ${folhaCount} Folha article(s) on first page!`);
  } else {
    console.log(`❌ ISSUE: No Folha articles on first page yet. They might be on page 2-3 now.`);
  }
}

runTest().catch(console.error);

