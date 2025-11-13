# TypeScript Strict Mode Migration Guide

This document tracks the gradual migration to full TypeScript strict mode for improved type safety and fewer runtime bugs.

## Current Status: Phase 1 (Partial Strict Mode)

The backend currently has **gradual strict mode** enabled. Some strict checks are active, while others are disabled to prevent build failures.

### ✅ Currently Enabled Checks

These checks are active and protecting against bugs:

- `strictFunctionTypes` - Ensures function parameter types are properly checked
- `strictBindCallApply` - Strict checking for bind/call/apply methods
- `noImplicitThis` - Prevents using `this` without proper context
- `alwaysStrict` - Emits "use strict" in all JavaScript files
- `noFallthroughCasesInSwitch` - Prevents accidental fall-through in switch statements

### ⚠️ Disabled But Should Be Enabled

These checks are currently **disabled** but should be enabled in future phases:

#### High Priority
- `noImplicitAny` - Currently **OFF**, allows implicit `any` types
  - **Impact**: 20+ instances of `any` type in codebase
  - **Files affected**: user.router.ts, shows.router.ts, apparel.router.ts, email-utils.ts

- `strictNullChecks` - Currently **OFF**, allows potential null/undefined errors
  - **Impact**: 44+ potential null reference errors
  - **Files affected**: Most route files, especially cart, purchase, and product routers

#### Medium Priority
- `noUnusedLocals` - Catches declared but unused variables
- `noUnusedParameters` - Catches declared but unused function parameters
- `noImplicitReturns` - Ensures all code paths return a value

## Migration Phases

### Phase 1: Foundational Strict Checks ✅ COMPLETE

**Status**: Complete
**Checks enabled**: `strictFunctionTypes`, `strictBindCallApply`, `noImplicitThis`, `alwaysStrict`, `noFallthroughCasesInSwitch`
**Errors**: 0

### Phase 2: Fix Explicit Any Types

**Goal**: Enable `noImplicitAny: true`
**Estimated errors**: 20+
**Timeline**: 2-4 hours

**Files to fix**:
1. `src/routes/user.router.ts` - Lines 172, 235, 252
2. `src/routes/shows.router.ts` - Lines 55, 135, 512
3. `src/routes/apparel.router.ts` - Line 223
4. `src/utils/email-utils.ts` - Lines 139, 184, 205, 226

**Example fixes**:
```typescript
// Before (implicit any)
const updateData: any = {};

// After (explicit type)
const updateData: Partial<UserUpdateInput> = {};
```

```typescript
// Before (type assertion to any)
variantWhere.gender = { in: genders as any };

// After (proper typing)
variantWhere.gender = { in: genders as Gender[] };
```

### Phase 3: Fix Null Safety

**Goal**: Enable `strictNullChecks: true`
**Estimated errors**: 40+
**Timeline**: 4-6 hours

**Common issues**:
1. Non-null assertions (`!`) should be replaced with proper checks
2. Potential null/undefined access should be guarded
3. Optional chaining should be used where appropriate

**Files to fix**:
- `src/routes/cart.router.ts` - Lines 176, 181, 190
- `src/routes/product.router.ts` - Lines 302, 460, 468, 472
- `src/routes/purchase.router.ts` - Lines 63-64, 116
- `src/routes/shows.router.ts` - Lines 548, 783
- `src/routes/user.router.ts` - Lines 121, 132

**Example fixes**:
```typescript
// Before (unsafe null assertion)
const price = product.unitProduct!.unitPrice;

// After (safe null check)
if (!product.unitProduct) {
  throw new Error("Unit product not found");
}
const price = product.unitProduct.unitPrice;
```

```typescript
// Before (potential null)
res.json(user.profile);

// After (null guard)
if (!user.profile) {
  return res.status(404).json({ error: "Profile not found" });
}
res.json(user.profile);
```

### Phase 4: Enable Unused Code Detection

**Goal**: Enable `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`
**Estimated errors**: 15+
**Timeline**: 1-2 hours

**Files with unused code**:
- `src/routes/apparel.router.ts` - Line 8 (`calcUnitPrice`), Lines 652, 749 (unused `req`)
- `src/routes/purchase.router.ts` - Lines 36-37 (`hasUnits`, `newBreakOrder`)
- `src/routes/reports.router.ts` - Line 5 (`stat`), Lines 254, 263, 270 (unused `req`)
- `src/routes/shows.router.ts` - Line 533 (`updatedShowData`), Line 634 (unused `req`)
- `src/utils/auth-utils.ts` - Line 4 (`date`)

### Phase 5: Full Strict Mode

**Goal**: Enable `"strict": true`
**Estimated effort**: All previous phases complete
**Timeline**: 1 day total

Enable full strict mode by uncommenting:
```json
"strict": true
```

## Quick Reference: Error Counts by File

| File | Errors | Primary Issues |
|------|--------|----------------|
| `src/routes/user.router.ts` | 3 | Null checks, type assertions |
| `src/routes/shows.router.ts` | 4 | Null checks, unused variables |
| `src/routes/product.router.ts` | 5 | Undefined checks, Prisma types |
| `src/routes/apparel.router.ts` | 6 | Any types, unused variables |
| `src/routes/cart.router.ts` | 3 | Null assignments |
| `src/routes/purchase.router.ts` | 4 | Unused imports, null checks |
| `src/routes/reports.router.ts` | 6 | Return statements, unused vars |
| `src/utils/auth-utils.ts` | 4 | Return statements, unused vars |
| `prisma/` files | 9 | Seed script type safety |

**Total errors with full strict mode**: ~44

## Testing Strategy

After each phase:

1. **Build check**: `npm run build`
2. **Type check**: `npx tsc --noEmit`
3. **Runtime test**: Start server and test critical paths
4. **Integration test**: Test API endpoints with Postman/curl

## Benefits of Full Strict Mode

1. **Catch bugs before runtime** - Null checks prevent crashes
2. **Better IDE support** - More accurate autocomplete and error detection
3. **Easier refactoring** - TypeScript catches breaking changes
4. **Code quality** - Forces explicit types and proper error handling
5. **Team collaboration** - Clear contracts between functions

## References

- [TypeScript Strict Mode Documentation](https://www.typescriptlang.org/tsconfig#strict)
- [Migrating to Strict Mode](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

## Notes

- The gradual approach prevents breaking the build while improving type safety
- Each phase can be done incrementally over time
- Priority should be given to user-facing routes (cart, purchase, user)
- Prisma-generated types sometimes require special handling with `Prisma.` namespace
