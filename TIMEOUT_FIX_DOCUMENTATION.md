# Timeout Fix Documentation

## Problem Resolved

Fixed the issue where wiki structure determination was timing out after 5 minutes when the actual processing time needed was 20+ minutes for complex repositories.

## Root Cause

The frontend had hardcoded timeout caps that overrode the backend's dynamic timeout calculations:

1. **Per-page timeout cap**: Limited to 300,000ms (5 minutes) regardless of complexity
2. **Default global timeout**: Defaulted to 300,000ms (5 minutes) when dynamic calculation wasn't available  
3. **Maximum threshold**: Extra-large repository threshold was only 900,000ms (15 minutes)

## Changes Made

### 1. Removed Hardcoded Timeout Caps

**File**: `src/app/[owner]/[repo]/page.tsx:1944`

**Before**:
```typescript
const pageTimeout = Math.min(recommendedTimeout / Math.max(complexity.estimated_files / 10, 1), 300000); // Max 5 minutes per page
```

**After**:
```typescript  
const maxPageTimeout = parseInt(process.env.NEXT_PUBLIC_MAX_PAGE_TIMEOUT || '900000'); // Default 15 minutes
const pageTimeout = Math.min(safeRecommendedTimeout / Math.max(complexity.estimated_files / 10, 1), maxPageTimeout);
```

### 2. Increased Timeout Thresholds

**File**: `src/app/[owner]/[repo]/page.tsx:1960-1964`

**Before**:
```typescript
thresholds: {
  xlarge: 900000   // 15 minutes for extra large repos
}
```

**After**:
```typescript
thresholds: {
  xlarge: parseInt(process.env.NEXT_PUBLIC_TIMEOUT_XLARGE || '1800000') // 30 minutes for extra large repos
}
```

### 3. Added Environment Variable Support

**File**: `src/app/[owner]/[repo]/page.tsx:839-840`

**Before**:
```typescript
const globalTimeout = (window as unknown as { deepwikiTimeouts?: { global?: number } }).deepwikiTimeouts?.global || 300000; // Use dynamic timeout or default 5 minutes
```

**After**:
```typescript
const defaultTimeout = parseInt(process.env.NEXT_PUBLIC_DEFAULT_TIMEOUT || '600000'); // Default 10 minutes
const globalTimeout = (window as unknown as { deepwikiTimeouts?: { global?: number } }).deepwikiTimeouts?.global || defaultTimeout;
```

### 4. Added Safety Bounds and Validation

**File**: `src/app/[owner]/[repo]/page.tsx:1945-1951`

```typescript
const maxProcessingTimeout = parseInt(process.env.NEXT_PUBLIC_MAX_PROCESSING_TIMEOUT || '7200000'); // Default 2 hours max
const maxPageTimeout = parseInt(process.env.NEXT_PUBLIC_MAX_PAGE_TIMEOUT || '900000'); // Default 15 minutes
const minTimeout = 300000; // Minimum 5 minutes for safety

// Apply safety bounds to recommended timeout
const safeRecommendedTimeout = Math.max(minTimeout, Math.min(recommendedTimeout, maxProcessingTimeout));
```

## Environment Variables Added

Created `.env.example` with the following configurable timeout options:

```bash
# Maximum global processing timeout (default: 2 hours)
NEXT_PUBLIC_MAX_PROCESSING_TIMEOUT=7200000

# Maximum per-page generation timeout (default: 15 minutes)  
NEXT_PUBLIC_MAX_PAGE_TIMEOUT=900000

# Default timeout when complexity analysis fails (default: 10 minutes)
NEXT_PUBLIC_DEFAULT_TIMEOUT=600000

# Repository size-based timeout thresholds
NEXT_PUBLIC_TIMEOUT_SMALL=120000      # 2 minutes
NEXT_PUBLIC_TIMEOUT_MEDIUM=300000     # 5 minutes
NEXT_PUBLIC_TIMEOUT_LARGE=600000      # 10 minutes
NEXT_PUBLIC_TIMEOUT_XLARGE=1800000    # 30 minutes
```

## How It Works Now

1. **Backend Analysis**: The Python backend (`api/data_pipeline.py`) analyzes repository complexity and recommends appropriate timeouts (e.g., 20+ minutes for complex repos)

2. **Frontend Respect**: The frontend now respects these recommendations instead of capping them at 5 minutes

3. **Safety Bounds**: Timeouts are still bounded by configurable maximums to prevent infinite waits:
   - Minimum: 5 minutes (safety)
   - Maximum: 2 hours (configurable via environment)

4. **Logging**: Added console logging to track timeout adjustments for debugging

## Expected Behavior

- **Complex repositories**: Will now receive timeouts of 20+ minutes as calculated by the backend
- **Simple repositories**: Will continue using shorter timeouts (2-5 minutes) 
- **Failed complexity analysis**: Will fallback to 10 minutes instead of 5 minutes
- **Safety**: All timeouts are bounded between 5 minutes and 2 hours

## Testing

- ✅ ESLint passes with only pre-existing warnings
- ✅ Next.js build completes successfully
- ✅ No TypeScript compilation errors
- ✅ Environment variables are properly typed and validated

## Backward Compatibility

All changes are backward compatible:
- Default values maintain reasonable behavior without environment variables
- Existing timeout logic continues to work
- No breaking changes to the API or user interface