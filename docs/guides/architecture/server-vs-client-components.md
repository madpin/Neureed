# Server vs Client Component Decision Tree

## Quick Reference

**Default: Use Server Component** (no `"use client"` directive)

Server Components are the default in Next.js 16 App Router. Only add `"use client"` when you absolutely need client-side interactivity.

---

## When You MUST Use Client Components

Add `"use client"` at the top of the file when you need:

### ❌ React Hooks
- `useState`, `useEffect`, `useContext`, `useReducer`
- `useCallback`, `useMemo`, `useRef`, `useLayoutEffect`
- `useTransition`, `useDeferredValue`, `useId`
- Any custom hooks that use the above

### ❌ Event Handlers
- `onClick`, `onChange`, `onSubmit`, `onInput`
- `onFocus`, `onBlur`, `onKeyDown`, `onKeyUp`
- `onMouseEnter`, `onMouseLeave`, `onMouseMove`
- Any user interaction

### ❌ Browser APIs
- `window`, `document`, `navigator`
- `localStorage`, `sessionStorage`
- `addEventListener`, `removeEventListener`
- Any browser-only APIs

### ❌ React Class Components
- `componentDidMount`, `componentDidUpdate`, etc.
- `React.Component` or `React.PureComponent`

### ❌ Context Consumers
- `useContext(MyContext)`
- Components that read from React Context

---

## When You CAN Use Server Components

Keep as Server Component (default) when:

### ✅ Pure Presentation
- Static text, images, layouts
- No user interaction required
- Purely displaying data

### ✅ Data Fetching
- Fetching data from databases
- Calling backend APIs
- Reading from file system

### ✅ Static Content
- Markdown rendering
- SEO-critical content
- Meta tags, headers

### ✅ Layouts & Templates
- Page layouts
- Navigation (non-interactive parts)
- Footers with static links

---

## Optimization Strategy: Push "use client" Down

The key to optimal bundle sizes is to push the `"use client"` directive as deep as possible in your component tree.

### ❌ Bad: Everything is Client

```tsx
// page.tsx
"use client";

export default function ArticlePage({ article }) {
  const [liked, setLiked] = useState(false);

  return (
    <div>
      <ArticleHeader title={article.title} />      {/* Doesn't need client */}
      <ArticleContent content={article.content} /> {/* Doesn't need client */}
      <LikeButton liked={liked} onLike={() => setLiked(true)} /> {/* NEEDS client */}
    </div>
  );
}
```

**Problem:** Entire page + all child components shipped as JavaScript to browser.

### ✅ Good: Client Only Where Needed

```tsx
// page.tsx (Server Component - default, no directive)
export default function ArticlePage({ article }) {
  return (
    <div>
      <ArticleHeader title={article.title} />      {/* Server Component */}
      <ArticleContent content={article.content} /> {/* Server Component */}
      <LikeButton />                              {/* Client Component */}
    </div>
  );
}

// LikeButton.tsx (Client Component)
"use client";

export function LikeButton() {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? "❤️ Liked" : "🤍 Like"}
    </button>
  );
}
```

**Benefit:**
- Only `LikeButton` shipped to browser
- Header & content rendered on server
- Smaller bundle, faster page load

---

## Common Patterns

### Pattern 1: Split Interactive from Static

**Before:**
```tsx
"use client";

export function UserProfile({ user }) {
  const [editing, setEditing] = useState(false);

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
      <button onClick={() => setEditing(true)}>Edit</button>
      {editing && <EditForm user={user} />}
    </div>
  );
}
```

**After:**
```tsx
// UserProfile.tsx (Server Component)
export function UserProfile({ user }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
      <EditButton userId={user.id} />
    </div>
  );
}

// EditButton.tsx (Client Component)
"use client";

export function EditButton({ userId }) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <button onClick={() => setEditing(true)}>Edit</button>
      {editing && <EditForm userId={userId} />}
    </>
  );
}
```

### Pattern 2: Data Fetching in Server Components

**Before (Client Component with useEffect):**
```tsx
"use client";

export function ArticleList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/articles')
      .then(res => res.json())
      .then(data => {
        setArticles(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <LoadingSpinner />;

  return <div>{articles.map(article => ...)}</div>;
}
```

**After (Server Component with async):**
```tsx
// ArticleList.tsx (Server Component - async!)
export async function ArticleList() {
  const articles = await db.article.findMany();

  return <div>{articles.map(article => ...)}</div>;
}

// page.tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ArticleList />
    </Suspense>
  );
}
```

**Benefits:**
- No client-side data fetching waterfall
- No loading state management
- Data fetched on server (faster, more secure)
- Zero JavaScript for data fetching shipped to browser

### Pattern 3: Compose Server + Client

Server Components can render Client Components as children:

```tsx
// Layout.tsx (Server Component)
export function Layout({ children }) {
  return (
    <div>
      <ServerNavigation />      {/* Server Component */}
      <Sidebar>                 {/* Client Component (interactive) */}
        {children}              {/* Can be Server Components! */}
      </Sidebar>
      <ServerFooter />          {/* Server Component */}
    </div>
  );
}
```

---

## Decision Flowchart

```
Does component need interactivity?
├─ No → Server Component (default)
│      ✅ Better for SEO
│      ✅ Smaller bundle
│      ✅ Can fetch data directly
│
└─ Yes → Does it need React hooks or event handlers?
       ├─ No → Server Component
       │
       └─ Yes → Can you split it?
              ├─ Yes → Split into Server (static) + Client (interactive)
              │        ✅ Optimal performance
              │
              └─ No → Client Component
                       ⚠️ Use "use client"
```

---

## Performance Impact

### Bundle Size Comparison

**Example app with 100% client components:**
- First Load JS: 850 KB
- Time to Interactive: 3.2s

**Same app with 30% client components (optimized):**
- First Load JS: 340 KB (-60%)
- Time to Interactive: 1.4s (-56%)

**Goal for NeuReed:** Reduce client components from 100% to ~30%

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Adding "use client" to fix import errors

```tsx
// Don't do this!
"use client"; // Added because of import error

import { someServerOnlyFunction } from './server-utils';
```

**Fix:** Move server-only code to separate files, import only in Server Components.

### ❌ Mistake 2: Using "use client" for async components

```tsx
// Don't do this!
"use client";

export async function MyComponent() { // ❌ Async not supported in Client Components
  const data = await fetch(...);
}
```

**Fix:** Remove `"use client"` - async components are Server Components.

### ❌ Mistake 3: Fetching data in Client Components with useEffect

```tsx
// Don't do this!
"use client";

export function MyComponent() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(...).then(setData);
  }, []);
}
```

**Fix:** Make it a Server Component and use async/await directly.

---

## Testing Client vs Server Components

Use the audit script:

```bash
./scripts/audit-client-components.sh
```

This will show:
- Total components
- Client vs Server ratio
- Optimization candidates
- Recommendations

---

## Resources

- [Next.js Server Components Docs](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Client Components Docs](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Composition Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)

---

**Last Updated:** 2025-01-25
**Refactoring Plan Phase:** 0 (Infrastructure Foundation)
