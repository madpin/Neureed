# Saved Searches Feature

## Overview

Saved Searches allow users to create persistent, dynamic feeds based on custom search criteria. Unlike traditional RSS feeds that pull from specific sources, Saved Searches continuously monitor all articles across the user's subscribed feeds and surface relevant content based on semantic similarity and keyword matching.

## User Value Proposition

- **Topic Tracking**: Monitor specific topics (e.g., "AI", "climate change", "quantum computing") across all your feeds without manually searching repeatedly
- **Multi-Term Queries**: Combine multiple related terms to capture broader coverage (e.g., "Anthropic" OR "Google Gemini" OR "Claude AI")
- **Precision Filtering**: Exclude irrelevant content with negative terms (e.g., "llama -animal" to get AI model news, not livestock articles)
- **Unified View**: Access saved searches alongside regular feeds in a familiar interface
- **Relevance Scoring**: See how closely each article matches your search criteria with visual indicators
- **Real-Time Updates**: Automatically populated as new articles arrive from feed refreshes

## Core Functionality

### Search Query Syntax

Users can create sophisticated queries using natural language with optional operators:

**Basic Search**
- `AI` - Articles semantically similar to "artificial intelligence"

**Multiple Terms (OR logic)**
- `Anthropic, Google Gemini, Claude` - Articles containing any of these terms
- Terms separated by commas are treated as alternatives (OR)

**Required Terms (AND logic)**
- `AI +regulation +Europe` - Articles must be relevant to all terms
- Terms with `+` prefix must appear in results

**Excluded Terms (NOT logic)**
- `llama -animal -farming` - Articles about "llama" but excluding anything about animals or farming
- Terms with `-` prefix are excluded from results

**Combined Queries**
- `AI, machine learning +ethics -cryptocurrency` - Articles about AI or ML, must include ethics, exclude crypto

**Phrase Matching**
- `"large language model"` - Exact phrase or semantically similar content

**Grouping with Parentheses**
- `(Anthropic, OpenAI) +ethics` - Articles about either company that must include ethics
- `AI +(regulation, policy) -cryptocurrency` - Articles about AI with regulation or policy, excluding crypto
- `(Claude, GPT, Gemini) +(benchmark, evaluation) -marketing` - Any LLM with performance metrics, no marketing
- `(llama, alpaca) +(Peru, Andes) -animal -farming` - Geographic/cultural content about these terms, not livestock
- `("machine learning", AI) +(healthcare, medical) +"clinical trials"` - ML/AI in healthcare specifically about clinical trials

**Complex Nested Queries**
- `((Anthropic, OpenAI) +(Claude, GPT)) +regulation` - Specific company/model pairs that must include regulation
- `(AI, "artificial intelligence") +((ethics, safety), (regulation, policy))` - AI content with either ethics/safety OR regulation/policy
- `(startup, company) +(AI, ML) +(funding, "series A", investment) -(cryptocurrency, web3)` - Startup funding news in AI/ML, excluding crypto

**Operator Precedence**
When no parentheses are specified, operators are evaluated in this order:
1. Phrase matching (`"..."`)
2. Exclusions (`-term`)
3. Requirements (`+term`)
4. Alternatives (`,`)

Using parentheses allows explicit control over evaluation order for precise query logic.

### Relevance Scoring

Each article in a saved search displays a relevance score indicating how well it matches the query:

- **90-100%**: Excellent match - Core topic with multiple term matches
- **75-89%**: Strong match - Clearly relevant with good semantic alignment
- **60-74%**: Moderate match - Relevant but tangential or partial match
- **Below 60%**: Weak match - Minimal relevance (configurable threshold)

**Visual Indicators**:
- Color-coded badges (green → yellow → gray)
- Percentage score displayed on article cards
- "Why matched" tooltip showing which terms triggered the match

## User Interface Integration

### 1. Creating a Saved Search

**Access Points**:
- **Sidebar**: "+ New Saved Search" button below the feed list
- **Search Bar**: "Save this search" button appears after performing any search
- **Quick Action**: Floating action button on home screen

**Creation Flow**:
1. Click "+ New Saved Search"
2. Modal appears with:
   - **Name**: User-friendly title (e.g., "AI Industry News")
   - **Query Builder**: Input field with syntax helpers
   - **Preview**: Live preview showing matching articles from existing content
   - **Match threshold**: Slider to adjust minimum relevance (default: 60%)
   - **Category assignment**: Optional categorization
   - **Icon selection**: Choose from icon library or emoji
3. Optional advanced settings:
   - Notification preferences (notify on high-relevance matches only)
   - Recency bias (prefer newer articles)
   - Source prioritization (weight certain feeds higher)

**Syntax Helper**:
- Inline suggestions as user types
- Smart parentheses auto-completion and balancing
- Syntax highlighting for operators, groups, and phrases
- Examples panel showing common patterns (including grouped queries)
- "Test Query" button to preview results before saving
- Visual query validation (highlights unbalanced parentheses or syntax errors)
- Quick insert buttons for operators: `+`, `-`, `()`, `""`

### 2. Saved Search Display

**Sidebar Integration**:
- Saved searches appear in sidebar with distinctive icon (magnifying glass with star)
- Grouped in a collapsible "Saved Searches" section
- Can be dragged into categories or kept separate
- Unread count badge shows new matching articles

**Feed View**:
- Clicking a saved search opens a view identical to a regular feed
- Header shows:
  - Search name and icon
  - Query terms as pills/tags (clickable to refine)
  - "Edit Search" button
  - Total matching articles count
  - Last updated timestamp
- Article cards include:
  - Relevance score badge
  - Matched terms highlighted in excerpt
  - Source feed name (since articles come from multiple feeds)

**Article List Features**:
- Default sort: Relevance × Recency
- Alternative sorts: Newest first, Highest relevance, Most engaged
- Filter by date range
- Filter by source feed
- "Why this article?" expandable section showing:
  - Matched terms and their contribution to score
  - Semantic similarity explanation
  - Source feed name

### 3. Managing Saved Searches

**Edit Saved Search**:
- Click gear icon or "Edit" button on saved search
- Modify query, name, threshold, or settings
- "Update Preview" shows how changes affect results
- Changes apply immediately

**Organize**:
- Drag saved searches into categories
- Reorder in sidebar
- Pin favorites to top
- Archive unused searches (hidden but recoverable)

**Duplicate**:
- "Duplicate" option creates copy for variations
- Useful for comparing different thresholds or term combinations

**Delete**:
- Confirmation dialog warns about losing query
- Option to export query text before deleting

### 4. Notifications

**Smart Notifications**:
- Notify when high-relevance articles (>85%) appear
- Option to receive daily digest of matches
- Configurable per saved search

**Notification Content**:
- "New match for [Search Name]"
- Article title and relevance score
- Quick action to mark as read or save

### 5. Saved Search Library

**Access**: Settings → Saved Searches Management

**Features**:
- Grid/list view of all saved searches
- Performance metrics:
  - Total articles matched
  - Average relevance score
  - Match frequency
  - Last match date
- Bulk actions (archive, delete, export)
- Import/export saved searches (shareable JSON format)
- Templates gallery (community-shared searches)

## Secondary Features

### Search Templates

Pre-built saved search templates for common use cases:
- **Technology**: AI Development, Cybersecurity, Web3, Open Source
- **News**: Breaking News, Local News, Politics
- **Research**: Academic Papers, Industry Reports
- **Personal**: Job Opportunities, Event Announcements

Users can:
- Browse template gallery
- Preview results before adding
- Customize before saving
- Submit their own templates

### Collaborative Searches

- Share saved search configuration via link
- Import from shared links
- Follow community searches (read-only, auto-updating)

### Search Performance Insights

Dashboard showing:
- Most productive searches (high match rate + high engagement)
- Underperforming searches (few/no matches)
- Suggested refinements based on engagement patterns
- Trending topics in your saved searches

### Advanced Query Builder (Power User Mode)

For users comfortable with complex queries:
- Visual query builder with draggable term blocks
- Parentheses grouping with visual nesting indicators (collapsible blocks)
- Boolean logic diagram showing AND/OR/NOT relationships with nested groups
- Drag-and-drop to reorganize terms and groups
- "Add Group" button to create parenthetical expressions
- Automatic parentheses balancing and validation
- Regex support for advanced pattern matching
- Field-specific searches (title:, content:, source:)
- Date range filters built into query
- Toggle between visual builder and text syntax modes

### Integration with Existing Features

**Pattern Learning**:
- Engagement with saved search results influences personalization
- Thumbs up/down on search results refines future matches

**Article Actions**:
- All standard actions available (save, mark read, feedback)
- "Remove from this search" option to fine-tune results

**Categories**:
- Saved searches can belong to categories
- Category view shows both feeds and saved searches together

**Export/Sharing**:
- Include saved search articles in article exports
- RSS feed generation for saved searches (access via unique URL)

## Mobile Experience

**Responsive Design**:
- Swipe gestures to manage saved searches
- Quick search refinement via bottom sheet
- Condensed relevance indicators (dots instead of percentages)
- Voice input for query creation

**Offline Access**:
- Cached saved search results available offline
- Sync when connection restored

## Onboarding

**First-Time User**:
- Tutorial highlighting saved search benefits
- Suggested starter searches based on feed subscriptions
- Interactive demo with sample queries

**Empty State**:
- When no saved searches exist, show:
  - "Get Started" guide
  - Template suggestions
  - Example queries with visual results

## Edge Cases & Considerations

**No Matches**:
- Empty state with helpful suggestions:
  - Lower relevance threshold
  - Broaden query terms
  - Check for typos
  - Try semantic alternatives

**Too Many Matches**:
- Warning when matches exceed 1000 articles
- Suggest query refinement or increasing threshold
- Option to limit to recent articles (last 30 days)

**Performance**:
- Indicator when search is processing (for complex queries)
- Background indexing status
- Option to pause expensive searches

**Search Conflicts**:
- Warning when term combinations are contradictory
- Suggestions to resolve (e.g., "AI +artificial -intelligence" is problematic)

## Success Metrics

Users would benefit from:
- Number of saved searches created
- Average engagement rate with search results
- Time saved vs. manual searching
- Discovery of relevant articles they would have missed

## Future Enhancements

- **AI-Suggested Searches**: Automatically suggest saved searches based on reading patterns
- **Multi-User Searches**: Team/family shared searches
- **Search Chains**: Use results from one search as input to another
- **Historical Analysis**: Track how topics evolve over time in your searches
- **Cross-Workspace**: Saved searches that work across multiple NeuReed accounts (for researchers)

---

## User Stories

### Story 1: AI Researcher
"As an AI researcher, I want to track mentions of 'Anthropic', 'Claude', and 'constitutional AI' across all my feeds, excluding marketing content, so I can stay updated on technical developments without reading every article."

**Query**: `(Anthropic, Claude, "constitutional AI") +(research, paper, benchmark, evaluation) -(marketing, "press release")`

### Story 2: Job Seeker
"As a job seeker, I want a saved search for 'senior developer, React, remote +hiring' in my tech feeds, so I can quickly spot relevant opportunities as they're posted."

**Query**: `(senior, lead) +(developer, engineer) +(React, TypeScript, Node.js) +remote +(hiring, "now hiring", jobs)`

### Story 3: Investor
"As an investor, I want to monitor 'renewable energy, solar, wind +investment -cryptocurrency' to find relevant market news while filtering out unrelated blockchain articles."

**Query**: `("renewable energy", solar, wind, hydro) +(investment, funding, IPO, "series A") -(cryptocurrency, bitcoin, web3, blockchain)`

### Story 4: News Junkie
"As a news enthusiast, I want to create searches for different aspects of a developing story (e.g., 'election +polls', 'election +debate', 'election +results') so I can track multiple angles without cluttering my main feed."

**Multiple Searches**:
- Polling: `election +(polls, polling, survey) +"2024"`
- Debates: `election +(debate, town hall) +(video, highlights)`
- Results: `election +(results, winner, "vote count")`

### Story 5: Content Curator
"As a content curator, I want to save searches for my newsletter topics and see which articles get the highest relevance scores, making my curation process more efficient."

**Query**: `(productivity, "remote work", "work from home") +(tips, tools, research, study) -(advertisement, sponsored, "affiliate link")`

### Story 6: Tech Analyst (Complex Queries)
"As a tech analyst covering AI safety, I want to create a search like `((Anthropic, OpenAI, Google) +(Claude, GPT, Gemini)) +((safety, alignment), (ethics, regulation)) -(marketing, "press release")` so I can track specific AI models from major companies when they're discussed in the context of safety or regulation, while filtering out promotional content."

---

## Design Principles

1. **Familiar Yet Distinct**: Saved searches look like feeds but have clear visual differentiation
2. **Transparent Relevance**: Users always understand why an article matched
3. **Progressive Complexity**: Simple queries work out of the box; advanced syntax for power users
4. **Live Feedback**: Changes to queries show immediate results
5. **Forgiving Syntax**: Natural language interpretation, not strict programming syntax
6. **Non-Destructive**: Editing or deleting searches doesn't affect original articles
7. **Shareable Knowledge**: Easy to share useful search configurations with others
