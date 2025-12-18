# react-safe-hooks

> Runtime-safe React hooks that warn developers about common hook misuse, stale closures, incorrect dependencies, and unsafe async state updates — without affecting production builds.

[![npm version](https://img.shields.io/npm/v/react-safe-hooks.svg)](https://www.npmjs.com/package/react-safe-hooks)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb.svg)](https://reactjs.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-green.svg)](package.json)

## Why react-safe-hooks?

ESLint's `react-hooks/exhaustive-deps` rule catches many issues statically, but some problems only manifest at runtime:

| Problem | ESLint | react-safe-hooks |
|---------|--------|------------------|
| Stale closures from missing deps | ⚠️ Sometimes | ✅ Runtime detection |
| Dependency array length changes | ❌ No | ✅ Detects |
| State updates after unmount | ❌ No | ✅ Warns |
| Unstable reference recreations | ❌ No | ✅ Heuristic detection |
| Excessive recomputations | ❌ No | ✅ Tracks |
| Conditional hook calls | ⚠️ Sometimes | ✅ Best-effort |

**Zero production cost**: All validation logic is completely stripped in production builds.

## Installation

```bash
npm install react-safe-hooks
# or
yarn add react-safe-hooks
# or
pnpm add react-safe-hooks
```

## Quick Start

Simply replace your hooks with their safe counterparts:

```tsx
import {
  useSafeState,
  useSafeEffect,
  useSafeCallback,
  useSafeMemo,
  useIsMounted,
} from 'react-safe-hooks';

function UserProfile({ userId }) {
  const [user, setUser] = useSafeState(null);
  const isMounted = useIsMounted();

  useSafeEffect(() => {
    fetchUser(userId).then((data) => {
      if (isMounted()) {
        setUser(data);
      }
    });
  }, [userId, isMounted]);

  const handleSave = useSafeCallback(() => {
    saveUser(user);
  }, [user]);

  const fullName = useSafeMemo(
    () => `${user?.firstName} ${user?.lastName}`,
    [user?.firstName, user?.lastName]
  );

  return <div>{fullName}</div>;
}
```

## Hooks API

### useSafeEffect

```tsx
useSafeEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options?: {
    name?: string;              // Identifier in warnings
    warnOnMissingDeps?: boolean; // Default: true
    warnOnChangingDeps?: boolean; // Default: true
  }
)
```

**Detects:**
- ⚠️ Missing dependency array
- ⚠️ Dependency array length changes between renders
- ⚠️ Unstable dependencies (objects/arrays recreated each render)

### useSafeCallback

```tsx
const fn = useSafeCallback(
  callback: (...args: any[]) => any,
  deps: DependencyList,
  options?: {
    name?: string;               // Identifier in warnings
    warnOnStaleClosure?: boolean; // Default: true
  }
);
```

**Detects:**
- ⚠️ Potential stale closures
- ⚠️ Unstable dependencies
- ⚠️ Excessive callback identity changes

### useSafeMemo

```tsx
const value = useSafeMemo(
  factory: () => T,
  deps: DependencyList,
  options?: {
    name?: string;             // Identifier in warnings
    warnOnRecompute?: boolean; // Default: true
    recomputeThreshold?: number; // Default: 10
  }
);
```

**Detects:**
- ⚠️ Excessive recomputations
- ⚠️ Unstable dependencies
- ⚠️ Dependency array length changes

### useSafeState

```tsx
const [state, setState] = useSafeState(initialState, options?: {
  name?: string; // Identifier in warnings
});
```

**Detects:**
- ⚠️ setState called after component unmount
- ⚠️ Async state update patterns that may cause issues

### useIsMounted

```tsx
const isMounted = useIsMounted();
// isMounted() returns true if component is mounted
```

A stable function reference that returns whether the component is currently mounted. Use this to guard async operations.

## Warning Messages

All warnings follow a consistent format:

```
⚠️ react-safe-hooks warning:

Component: UserProfile
Hook: useSafeEffect

Dependency array length changed between renders.
Length changed from 2 to 3.

Fix:
Ensure your dependency array has a stable length.
Conditional dependencies should be handled inside the effect, not in the array.
```

### Common Warnings Explained

#### "Effect has no dependency array"

```tsx
// ❌ Bad: Runs on every render
useSafeEffect(() => {
  console.log('This runs too often');
});

// ✅ Good: Explicit about when to run
useSafeEffect(() => {
  console.log('Runs once');
}, []);
```

#### "Dependency array length changed"

```tsx
// ❌ Bad: Conditional dependency
useSafeEffect(() => {
  // ...
}, showExtra ? [a, b, c] : [a, b]);

// ✅ Good: Handle condition inside effect
useSafeEffect(() => {
  if (showExtra) {
    // use c
  }
}, [a, b, c, showExtra]);
```

#### "Potentially unstable dependencies"

```tsx
// ❌ Bad: New object on every render
useSafeEffect(() => {
  fetch('/api', options);
}, [{ method: 'POST' }]); // ← recreated each render!

// ✅ Good: Memoize or extract
const options = useMemo(() => ({ method: 'POST' }), []);
useSafeEffect(() => {
  fetch('/api', options);
}, [options]);
```

#### "Attempted to update state after unmount"

```tsx
// ❌ Bad: No unmount check
useEffect(() => {
  fetchData().then(setData); // May run after unmount!
}, []);

// ✅ Good: Check mounted state
const isMounted = useIsMounted();
useSafeEffect(() => {
  fetchData().then((data) => {
    if (isMounted()) setData(data);
  });
}, [isMounted]);
```

## Production Safety

This library is designed to have **zero runtime cost in production**:

```tsx
// In development:
// - All checks run
// - Warnings are displayed
// - Full debugging context

// In production (NODE_ENV === "production"):
// - All checks are stripped
// - Hooks behave identically to native hooks
// - No performance overhead
```

The `__DEV__` guard allows bundlers to tree-shake all development code:

```javascript
// This entire block is removed in production
if (__DEV__) {
  // validation logic
}
```

## Comparison with Native Hooks

| Feature | Native | react-safe-hooks |
|---------|--------|------------------|
| Functionality | ✅ | ✅ Identical |
| Type safety | ✅ | ✅ Same types |
| Dev warnings | ❌ | ✅ Comprehensive |
| Prod performance | ✅ Optimal | ✅ Identical |
| Bundle size impact | - | ~0 in prod |

## FAQ

### Does this affect production performance?

No. All development checks use `process.env.NODE_ENV !== "production"` guards, which bundlers like webpack, Rollup, and esbuild eliminate entirely during production builds.

### Is this SSR compatible?

Yes. The hooks work identically in SSR environments. Warnings only appear in the browser console during development.

### Should I use these everywhere or just for debugging?

You can safely use these as drop-in replacements for the native hooks. In production, they're identical to the native versions. In development, you get extra safety checks.

### How does stale closure detection work?

The library uses heuristics to detect when dependencies change but the callback reference doesn't update. This isn't foolproof but catches common patterns.

### Can I disable specific warnings?

Yes, use the options parameter:

```tsx
useSafeEffect(
  () => { /* ... */ },
  [],
  { warnOnMissingDeps: false }
);
```

### Does this replace the ESLint rules?

No, use both! ESLint catches issues statically at build time, while react-safe-hooks catches runtime patterns that static analysis can't detect.

## Requirements

- React 18.0.0 or higher
- TypeScript 4.7+ (optional but recommended)

## License

MIT © 2024

---

<p align="center">
  Made with ❤️ for React developers who want safer hooks
</p>
