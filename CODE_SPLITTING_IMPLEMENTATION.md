# Code Splitting Implementation

## Overview

This implementation reduces the initial bundle size by implementing strategic code splitting across the grocery app. The goal is to improve Core Web Vitals, especially LCP (Largest Contentful Paint) and FCP (First Contentful Paint).

## What Was Implemented

### 1. Route-Level Code Splitting

**Files Modified:**

- `src/app/(dashboard)/page.tsx` - Lists page
- `src/app/(dashboard)/recipes/page.tsx` - Recipes page
- `src/app/(dashboard)/profile/page.tsx` - Profile page

**Implementation:**

- Converted static imports to dynamic imports using `next/dynamic`
- Added loading states with skeleton components
- Disabled SSR for client components to reduce server bundle

### 2. Component-Level Code Splitting

**Heavy Components Split:**

- `ListDetailsDrawer` - Shopping list management
- `RecipeFormDrawer` - Recipe creation/editing
- `RecipeViewDrawer` - Recipe viewing
- `AddListDialog` - List creation
- `ShareListDialog` - List sharing
- `FamilyMemberDialog` - Family management
- `ImageCropWorkflow` - AI image processing
- `ImageToTextButton` - OCR functionality

### 3. Centralized Dynamic Imports

**File:** `src/components/dynamic-imports.tsx`

This file centralizes all dynamic imports with:

- Consistent loading states
- Proper error boundaries
- Optimized chunk naming

### 4. Webpack Bundle Optimization

**Enhanced `next.config.js`:**

- Vendor chunk splitting (React, Next.js, etc.)
- Radix UI component splitting
- Lucide React icon splitting
- AI/ML component isolation
- Recipe component grouping
- List component grouping
- Form component grouping

## Expected Performance Improvements

### Bundle Size Reduction

- **Initial Bundle**: ~30-40% smaller
- **Route-Specific Bundles**: Load only when needed
- **AI Components**: Isolated from main bundle

### Core Web Vitals Impact

- **LCP**: Improved by loading critical content first
- **FCP**: Faster initial paint with smaller bundles
- **FID**: Better interactivity with lighter initial load
- **CLS**: Reduced layout shifts from dynamic loading

### Loading Strategy

1. **Critical Path**: Navigation, basic UI components
2. **Route-Specific**: Page components loaded on demand
3. **Feature-Specific**: Heavy features (AI, forms) loaded when used

## How to Test

### 1. Build Analysis

```bash
npm run build:analyze
```

This will generate a bundle analysis report showing chunk sizes.

### 2. Performance Monitoring

```bash
npm run build
npm start
```

Then run Lighthouse tests to see Core Web Vitals improvements.

### 3. Development Testing

```bash
npm run dev
```

Check Network tab in DevTools to see chunk loading.

## Bundle Structure

```
Initial Bundle:
├── vendors (React, Next.js)
├── radix-ui (UI components)
├── lucide (Icons)
└── critical-path (Navigation, basic UI)

Route Bundles:
├── lists-page
├── recipes-page
└── profile-page

Feature Bundles:
├── ai-components (Image processing)
├── recipe-components (Recipe management)
├── list-components (List management)
└── form-components (Form handling)
```

## Best Practices Implemented

1. **Progressive Loading**: Critical content loads first
2. **Skeleton States**: Smooth loading experience
3. **Error Boundaries**: Graceful fallbacks
4. **Chunk Optimization**: Logical grouping of related code
5. **SSR Optimization**: Client components don't bloat server bundle

## Monitoring

Use the `PerformanceMonitor` component to track:

- LCP improvements
- FCP improvements
- Bundle loading times
- User interaction responsiveness

## Future Optimizations

1. **Preloading**: Preload critical routes on hover
2. **Service Worker**: Cache route bundles
3. **Intersection Observer**: Load components when near viewport
4. **Priority Hints**: Mark critical resources with high priority
