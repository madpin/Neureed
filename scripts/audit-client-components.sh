#!/bin/bash

# NeuReed Client Component Audit Script
#
# This script analyzes the codebase to identify client vs server components
# and provides metrics for optimization opportunities.

echo "==================================================================="
echo "    NeuReed Client Component Audit"
echo "==================================================================="
echo ""
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "-------------------------------------------------------------------"
echo " 1. Component Count Overview"
echo "-------------------------------------------------------------------"

total_components=$(find app -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" | wc -l | tr -d ' ')
echo "Total .tsx files in app/: ${GREEN}${total_components}${NC}"

client_components=$(grep -r "use client" app --include="*.tsx" --include="*.ts" -l | wc -l | tr -d ' ')
echo "Files with 'use client': ${YELLOW}${client_components}${NC}"

server_components=$((total_components - client_components))
echo "Implied server components: ${GREEN}${server_components}${NC}"

if [ $total_components -gt 0 ]; then
  client_percentage=$((client_components * 100 / total_components))
  echo ""
  echo "Client component ratio: ${YELLOW}${client_percentage}%${NC}"
  echo "(Target for optimal bundle size: ~30%)"
fi

echo ""
echo "-------------------------------------------------------------------"
echo " 2. Client Components by Directory"
echo "-------------------------------------------------------------------"

for dir in app/components app/admin app/api; do
  if [ -d "$dir" ]; then
    count=$(grep -r "use client" "$dir" --include="*.tsx" --include="*.ts" -l 2>/dev/null | wc -l | tr -d ' ')
    total=$(find "$dir" -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/.next/*" 2>/dev/null | wc -l | tr -d ' ')
    if [ $total -gt 0 ]; then
      percentage=$((count * 100 / total))
      echo "  $dir: ${YELLOW}${count}${NC} / ${total} (${percentage}%)"
    fi
  fi
done

echo ""
echo "-------------------------------------------------------------------"
echo " 3. All Files with 'use client'"
echo "-------------------------------------------------------------------"

grep -r "use client" app --include="*.tsx" --include="*.ts" | sed 's/:use client.*//' | sort

echo ""
echo "-------------------------------------------------------------------"
echo " 4. Potential Optimization Candidates"
echo "-------------------------------------------------------------------"
echo "Looking for client components that might not need interactivity..."
echo ""

# Find client components that don't seem to use hooks or event handlers
# This is a heuristic and may have false positives
while IFS= read -r file; do
  if [ -f "$file" ]; then
    # Check if file has 'use client' but no obvious client-side features
    if grep -q "use client" "$file"; then
      has_hooks=false
      has_events=false

      if grep -qE "useState|useEffect|useContext|useReducer|useCallback|useMemo|useRef|useLayoutEffect|useTransition|useDeferredValue|useId|useInsertionEffect|useSyncExternalStore" "$file"; then
        has_hooks=true
      fi

      if grep -qE "onClick|onChange|onSubmit|onInput|onFocus|onBlur|onKeyDown|onKeyUp|onMouseEnter|onMouseLeave|onMouseMove" "$file"; then
        has_events=true
      fi

      if [ "$has_hooks" = false ] && [ "$has_events" = false ]; then
        echo "${YELLOW}?${NC} $file"
        echo "   (No obvious hooks or event handlers detected)"
      fi
    fi
  fi
done < <(find app -name "*.tsx" -type f -not -path "*/node_modules/*" -not -path "*/.next/*")

echo ""
echo "-------------------------------------------------------------------"
echo " 5. Recommendations"
echo "-------------------------------------------------------------------"
echo ""
echo "✓ ${GREEN}Server Components${NC} (default, no 'use client'):"
echo "  - Better for SEO"
echo "  - Smaller bundle sizes"
echo "  - Can fetch data directly"
echo "  - Use for: static content, layouts, data fetching"
echo ""
echo "✓ ${YELLOW}Client Components${NC} (with 'use client'):"
echo "  - Required for interactivity"
echo "  - Can use React hooks"
echo "  - Can use browser APIs"
echo "  - Use for: forms, interactive widgets, state management"
echo ""
echo "📊 ${YELLOW}Next Steps:${NC}"
echo "  1. Review components marked with '?' above"
echo "  2. Consider splitting components: server wrapper + client interactive parts"
echo "  3. Push 'use client' as deep as possible in the component tree"
echo "  4. Aim for ~30% client components for optimal performance"
echo ""
echo "==================================================================="
echo " Audit Complete"
echo "==================================================================="
