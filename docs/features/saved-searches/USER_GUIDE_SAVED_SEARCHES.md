# User Guide: Saved Searches

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Creating Your First Saved Search](#creating-your-first-saved-search)
4. [Query Syntax Guide](#query-syntax-guide)
5. [Managing Your Saved Searches](#managing-your-saved-searches)
6. [Understanding Relevance Scores](#understanding-relevance-scores)
7. [Notifications & Alerts](#notifications--alerts)
8. [Advanced Features](#advanced-features)
9. [Mobile Experience](#mobile-experience)
10. [Tips & Best Practices](#tips--best-practices)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Introduction

Saved Searches in NeuReed allow you to create persistent, intelligent queries that automatically match new articles as they arrive. Instead of manually searching every time, you can set up searches that continuously monitor your feeds for relevant content.

### Key Benefits

- **Automatic Monitoring**: Articles are matched against your searches as soon as they're fetched
- **Semantic Understanding**: Combines AI-powered semantic search with traditional keyword matching
- **Customizable Alerts**: Get notified when high-relevance articles match your criteria
- **Cross-Feed Search**: Search across all your subscribed feeds simultaneously
- **Always Up-to-Date**: New matches appear automatically without manual refreshing

---

## Getting Started

### Accessing Saved Searches

1. Look for the **Saved Searches** section in the sidebar
2. Click the **"+ New Saved Search"** button to create your first search
3. Or use the search bar in the header and click the **bookmark icon** to save a search

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection (offline mode available for viewing cached results)

---

## Creating Your First Saved Search

### Step-by-Step Guide

1. **Open the Creation Dialog**
   - Click "New Saved Search" in the sidebar, or
   - Perform a search and click the bookmark icon to save it

2. **Choose an Icon** (Optional)
   - Click the icon selector to choose a visual identifier
   - Popular icons: 🔍 📰 ⭐ 🔥 💡 📌 🎯 🚀

3. **Name Your Search**
   - Give it a descriptive name (e.g., "AI Ethics News")
   - Keep it short and memorable

4. **Build Your Query**
   - Enter search terms using the query builder
   - Use operators to refine your search (see Query Syntax Guide)
   - Click "Show preview" to see matching articles

5. **Adjust Settings**
   - **Match Threshold**: How relevant articles must be (60-100%)
   - **Notifications**: Enable alerts for new matches
   - **Advanced**: Adjust recency bias and other options

6. **Save and Monitor**
   - Click "Create" to save your search
   - View matches immediately in the main content area

---

## Query Syntax Guide

### Basic Operators

#### **`,` (OR) - Match Any Term**
```
AI, "machine learning", robotics
```
Finds articles containing **any** of these terms.

#### **`+` (AND) - Required Term**
```
+AI +ethics
```
Finds articles that **must contain both** terms.

#### **`-` (NOT) - Exclude Term**
```
AI -chatbot
```
Finds articles about AI but **excludes** those mentioning chatbots.

#### **`"..."` (Phrase) - Exact Match**
```
"artificial intelligence"
```
Matches the **exact phrase** in that order.

#### **`()` (Grouping) - Control Precedence**
```
(AI, ML) +ethics
```
Finds articles with (AI **or** ML) **and** ethics.

### Complex Examples

#### Example 1: Tech News Filtering
```
(+AI, +"machine learning") +ethics -opinion -chatbot
```
**Explanation**: Articles about AI or machine learning that must include ethics discussion, excluding opinion pieces and chatbot topics.

#### Example 2: Climate Policy Research
```
"climate change" +(policy, regulation, legislation) -editorial
```
**Explanation**: Exact phrase "climate change" with policy-related terms, excluding editorials.

#### Example 3: Startup Funding News
```
(startup, "venture capital") +(funding, investment) +("series A", "series B")
```
**Explanation**: Startup or VC articles about funding that specifically mention Series A or B rounds.

### Operator Precedence

1. **Phrases** (`"..."`) - Highest priority
2. **Exclusions** (`-`)
3. **Requirements** (`+`)
4. **Alternatives** (`,`) - Lowest priority

**Tip**: Use parentheses `()` to explicitly control order of operations.

---

## Managing Your Saved Searches

### Viewing Matches

1. Click a saved search in the sidebar
2. Articles are sorted by relevance score (highest first)
3. Each article shows:
   - Relevance badge (percentage or dots on mobile)
   - Source feed
   - Matched terms highlighting
   - "Why this matched" explanation

### Editing a Search

1. Click the **three-dot menu** next to the search name
2. Select **"Edit"**
3. Modify any settings
4. Click **"Update"** to save changes
5. Existing matches are automatically re-evaluated

### Deleting a Search

1. Click the **three-dot menu**
2. Select **"Delete"**
3. Confirm the deletion
4. All associated matches are removed

### Rematching

If you've made changes to your feeds or want to find matches in older articles:

1. Click the **three-dot menu**
2. Select **"Rematch"**
3. The system re-evaluates all articles against this search
4. New matches will appear immediately

### Archiving (Future Feature)

- Archive inactive searches to declutter your sidebar
- Archived searches don't process new articles
- Easily restore when needed

---

## Understanding Relevance Scores

### Score Breakdown

Relevance scores range from **0.0 to 1.0** (displayed as 0-100%):

- **85%+** (🟢 Green) - Excellent match, highly relevant
- **70-84%** (🔵 Blue) - Good match, relevant
- **60-69%** (🟡 Yellow) - Moderate match, somewhat relevant
- **Below 60%** - Below threshold (not shown by default)

### How Scores Are Calculated

1. **Semantic Similarity (60%)**: AI embedding comparison
2. **Keyword Matching (40%)**: TF-IDF weighted term presence
3. **Boolean Filters**: AND/OR/NOT logic must pass
4. **Recency Boost**: Optional bonus for newer articles

### Mobile Display

On mobile devices, relevance is shown as **colored dots**:
- 🔴🔴🔴 Three dots = 85%+
- 🔴🔴⚪ Two dots = 70-84%
- 🔴⚪⚪ One dot = 60-69%

---

## Notifications & Alerts

### Enabling Notifications

1. Edit your saved search
2. Check **"Notify me when new articles match this search"**
3. Set the **Notification Threshold** (default: 85%)
4. Optionally enable **"Daily digest"** for batched notifications

### Notification Types

#### **Real-Time Alerts**
- Receive instant notifications for high-relevance matches
- Useful for time-sensitive topics
- Can be rate-limited to prevent spam (max 10/hour per search)

#### **Daily Digest**
- Receive one daily summary of all matches
- Sent at 9 AM local time
- Includes match counts and top articles

### Managing Notification Overload

If you're receiving too many notifications:

1. **Increase the threshold** (e.g., from 85% to 90%)
2. **Enable daily digest** instead of real-time
3. **Refine your query** to be more specific
4. **Disable notifications** and check manually

---

## Advanced Features

### Recency Bias

Control how much weight is given to newer articles:

- **0.0** - No preference (pure relevance)
- **0.5** - Moderate preference for recent articles
- **1.0** - Strong preference for recent articles

Formula: `score × (1 + recency_bias × e^(-age_days / 30))`

**When to Use**:
- Set higher (0.7-1.0) for fast-moving topics (tech news, politics)
- Set lower (0.0-0.3) for evergreen content (research, tutorials)

### Priority Sources (Future Feature)

Boost articles from specific feeds:
- Mark certain feeds as "priority"
- Their articles get a 1.2× relevance multiplier
- Useful for trusted sources in your niche

### Category Filtering (Future Feature)

Restrict searches to specific feed categories:
- Only search within "Technology" feeds
- Or across "News" and "Politics" categories
- Improves precision for focused topics

### Search Templates

Use pre-built templates for common use cases:

1. **Technology Trends**: AI, ML, crypto, cybersecurity
2. **Breaking News**: Real-time news monitoring
3. **Academic Research**: Scholarly articles and papers
4. **Job Listings**: Remote work, specific roles
5. **Local News**: Location-based content

Access templates by clicking **"Browse Templates"** in the creation dialog.

---

## Mobile Experience

### Optimizations

- **Bottom Sheet Modal**: Swipe down to close creation dialog
- **Condensed Indicators**: Relevance shown as dots instead of percentages
- **Swipe Gestures**: Swipe left on saved searches to reveal edit/delete actions
- **Simplified Syntax Helper**: Expandable panels instead of full documentation
- **Offline Support**: Cached searches and results available offline

### Gestures

- **Swipe down** on modal: Close
- **Swipe left** on saved search: Show actions
- **Tap** on syntax operator: Insert into query
- **Long press** on article: Quick actions menu

### Offline Mode

When offline, you can:
- ✅ View cached saved searches
- ✅ Browse recent match results
- ✅ Read article details
- ❌ Create new searches (requires connection)
- ❌ Trigger rematching

Changes sync automatically when connection is restored.

---

## Tips & Best Practices

### Writing Effective Queries

1. **Start Simple, Then Refine**
   - Begin with basic terms
   - Add operators gradually based on results
   - Use preview to test before saving

2. **Use Exact Phrases for Precision**
   - `"machine learning"` vs `machine learning`
   - Reduces false positives significantly

3. **Combine Semantic + Keyword**
   - `(+AI, +"deep learning") +ethics`
   - Semantic search finds related concepts
   - Keywords ensure specific topics are present

4. **Exclude Noise Strategically**
   - `-opinion -editorial -review`
   - `-beginner -tutorial` (for advanced content)
   - `-job -hiring` (to exclude listings)

5. **Test with Preview**
   - Always preview before saving
   - Check if results match your intent
   - Adjust threshold if needed

### Organizing Searches

1. **Use Descriptive Names**
   - ❌ "Search 1"
   - ✅ "AI Ethics - Academic Papers"

2. **Choose Meaningful Icons**
   - 📰 News monitoring
   - 💼 Career/jobs
   - 🔬 Research
   - 🚨 Urgent/breaking

3. **Group by Theme**
   - Create related searches together
   - Use similar icons for same category
   - Easier to scan in sidebar

### Performance Optimization

1. **Adjust Thresholds Appropriately**
   - Too low (50-60%): Many irrelevant matches
   - Too high (95-100%): May miss relevant content
   - Sweet spot: 70-80% for most topics

2. **Use Recency Bias Wisely**
   - Don't overuse (can hide older gems)
   - Best for time-sensitive content
   - Set to 0 for research/tutorials

3. **Limit Active Searches**
   - Archive searches you don't check often
   - Reduces system load
   - Improves overall performance

---

## Troubleshooting

### No Matches Found

**Problem**: Saved search returns zero results

**Solutions**:
1. Lower the match threshold (try 60%)
2. Simplify the query (remove some requirements)
3. Check for typos in query terms
4. Try broader terms (e.g., "AI" instead of "artificial general intelligence")
5. Trigger a rematch to scan older articles

### Too Many Irrelevant Matches

**Problem**: Getting lots of low-quality matches

**Solutions**:
1. Increase the match threshold (try 80%+)
2. Add exclusion terms (`-spam -clickbait`)
3. Use exact phrases for specific concepts
4. Add required terms with `+`
5. Make your query more specific

### Matches Missing Expected Articles

**Problem**: Known relevant articles aren't matching

**Solutions**:
1. Lower the threshold temporarily
2. Check if article was published after search creation
3. Trigger a rematch
4. Verify article is from a subscribed feed
5. Check query syntax (unbalanced quotes/parentheses)

### Syntax Errors

**Problem**: "Invalid query syntax" error message

**Solutions**:
1. Check for unbalanced quotes: `"phrase should close`
2. Check for unbalanced parentheses: `(missing closing`
3. Avoid double operators: `++term` or `--term`
4. Use the syntax helper for guidance
5. Start fresh with a simpler query

### Notifications Not Working

**Problem**: Not receiving expected alerts

**Solutions**:
1. Verify notifications are enabled for the search
2. Check notification threshold (may be too high)
3. Ensure browser notifications are allowed
4. Check if matches are below notification threshold
5. Try daily digest mode instead

---

## FAQ

### Q: How often are new articles matched?

**A**: Articles are matched immediately when feeds are refreshed (typically every 30 minutes). You can also manually trigger a rematch for a specific search.

### Q: Can I search across only certain feeds?

**A**: This feature is coming soon! For now, searches span all your subscribed feeds. You can use the feed filter in the articles view to narrow results.

### Q: What's the difference between saved searches and semantic search?

**A**:
- **Semantic Search**: One-time query for immediate results
- **Saved Searches**: Persistent, automatically match new articles forever

Both use the same AI-powered semantic understanding.

### Q: How many saved searches can I create?

**A**: Currently no hard limit, but we recommend keeping it under 20 for optimal performance. Archive searches you don't actively use.

### Q: Do saved searches work on old articles?

**A**: Yes! When you create a search, it immediately matches against all existing articles. Use "Rematch" to re-evaluate if needed.

### Q: Can I share saved searches with others?

**A**: Not yet, but this is on the roadmap! You'll soon be able to export/import search configurations.

### Q: What happens to matches when I delete a search?

**A**: All match records are permanently deleted. Articles themselves remain in your feeds.

### Q: Can I export my search results?

**A**: Currently not available, but planned for a future update. You'll be able to export as JSON, CSV, or RSS.

### Q: Does this work offline?

**A**: Partially. Cached searches and recent results are available offline on mobile. Creating new searches or triggering rematches requires an internet connection.

### Q: How is this different from feed categories?

**A**:
- **Categories**: Organize entire feeds
- **Saved Searches**: Find specific topics across all feeds

They complement each other! Use categories for broad organization, saved searches for precise content discovery.

---

## Need More Help?

- **Documentation**: Check out [FEATURE_SAVED_SEARCHES.md](./FEATURE_SAVED_SEARCHES.md) for technical details
- **GitHub Issues**: Report bugs or request features at [github.com/your-repo/issues](https://github.com/your-repo/issues)
- **Community**: Join our Discord/Forum for tips and discussions

---

**Last Updated**: January 2025
**Version**: 1.0
