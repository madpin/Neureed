# Mobile UI Fixes

## Issues Fixed

### 1. Sidebar Showing Behind Content on Mobile

**Problem**: The sidebar was appearing behind the list of news articles on mobile devices, making it unusable.

**Root Cause**: 
- The sidebar had `z-50` on mobile, but lacked proper responsive z-index handling
- The sidebar was always transformed off-screen on mobile, even when it should be visible in desktop mode
- Missing `md:translate-x-0` in the conditional transform class

**Solution** (in `app/components/layout/MainLayout.tsx`):
```tsx
// Before:
className={`
  flex-shrink-0 overflow-hidden border-r border-border bg-background relative
  md:relative md:translate-x-0
  fixed inset-y-0 left-0 z-50 w-64
  transform transition-transform duration-300 ease-in-out
  ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
`}

// After:
className={`
  flex-shrink-0 overflow-hidden border-r border-border bg-background
  md:relative md:translate-x-0 md:z-auto
  fixed inset-y-0 left-0 z-50 w-64
  transform transition-transform duration-300 ease-in-out
  ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
`}
```

**Changes**:
1. Removed redundant `relative` class
2. Added `md:z-auto` to reset z-index on desktop
3. Added `md:translate-x-0` to the conditional transform to ensure sidebar is visible on desktop

### 2. Preference Modal Cutting Off Top and Bottom on Mobile

**Problem**: The preference modal was cutting off content at the top and bottom on mobile devices.

**Root Cause**:
- Modal height was fixed at `h-[90vh]` on mobile, which doesn't account for safe areas and mobile browser chrome
- The main content area had `overflow-y-auto` on the wrong element, preventing proper scrolling
- Missing flex-shrink controls on header and footer elements

**Solution** (in `app/components/preferences/PreferencesModal.tsx`):

#### Modal Container
```tsx
// Before:
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
  <div ref={modalRef} className="flex h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-background shadow-xl">

// After:
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 md:p-6">
  <div ref={modalRef} className="flex h-full md:h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-background shadow-xl">
```

#### Main Content Area
```tsx
// Before:
<main className="flex flex-1 flex-col overflow-y-auto">
  <div className="md:hidden border-b border-border p-4">
  ...
  <div className="flex-1 p-6">

// After:
<main className="flex flex-1 flex-col overflow-hidden">
  <div className="md:hidden border-b border-border p-4 flex-shrink-0">
  ...
  <div className="flex-1 p-6 overflow-y-auto">
```

#### Footer
```tsx
// Before:
<div className="border-t border-border bg-background p-4">

// After:
<div className="border-t border-border bg-background p-4 flex-shrink-0">
```

**Changes**:
1. Changed modal height from `h-[90vh]` to `h-full` on mobile, `md:h-[90vh]` on desktop
2. Added responsive padding: `p-4 md:p-6`
3. Moved `overflow-y-auto` from main container to content area
4. Added `flex-shrink-0` to header and footer to prevent them from being compressed
5. Added `overflow-hidden` to main container to establish proper scrolling context

## Testing Checklist

- [ ] Test sidebar on mobile devices (iOS Safari, Chrome)
  - [ ] Sidebar opens when hamburger menu is clicked
  - [ ] Sidebar appears above content (not behind)
  - [ ] Backdrop dims content properly
  - [ ] Sidebar closes when clicking outside
  - [ ] Sidebar transitions smoothly

- [ ] Test sidebar on tablet (iPad, Android tablets)
  - [ ] Sidebar behaves correctly at breakpoint
  - [ ] Resize handle works properly

- [ ] Test sidebar on desktop
  - [ ] Sidebar is visible by default
  - [ ] Sidebar resizing works
  - [ ] Collapse/expand functionality works

- [ ] Test preference modal on mobile devices
  - [ ] Modal doesn't cut off at top
  - [ ] Modal doesn't cut off at bottom
  - [ ] All content is scrollable
  - [ ] Mobile navigation dropdown works
  - [ ] Save/Cancel buttons are always visible

- [ ] Test preference modal on desktop
  - [ ] Modal maintains 90vh height
  - [ ] Sidebar navigation works
  - [ ] Content scrolls properly

## Technical Details

### CSS Classes Used

**Tailwind Classes**:
- `z-50`: High z-index for mobile overlay
- `md:z-auto`: Reset z-index on desktop
- `fixed inset-y-0 left-0`: Position sidebar on mobile
- `md:relative`: Use relative positioning on desktop
- `transform transition-transform`: Smooth slide animation
- `flex-shrink-0`: Prevent flex items from shrinking
- `overflow-hidden` / `overflow-y-auto`: Control scrolling behavior

**Responsive Breakpoints**:
- `md:` - 768px and above (desktop)
- Default - Below 768px (mobile/tablet)

### Browser Compatibility

These changes are compatible with:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 12+
- Android Chrome 80+
- Mobile browsers with flexbox support

### Performance Considerations

- Transform animations use GPU acceleration
- Z-index changes only at breakpoints (no constant recalculation)
- Overflow is properly contained to prevent layout thrashing

## Related Files

- `app/components/layout/MainLayout.tsx` - Main layout with sidebar
- `app/components/preferences/PreferencesModal.tsx` - Preferences modal
- `app/page.tsx` - Main page using the layout

## Future Improvements

1. Consider using a modal library like Radix UI or Headless UI for better accessibility
2. Add keyboard navigation for closing modals (ESC key)
3. Add focus trap in modals for better accessibility
4. Consider adding swipe-to-close gesture for mobile
5. Add animation for modal entry/exit

