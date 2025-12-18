/**
 * useSafeMemo - Memoization hook with recomputation tracking.
 *
 * Wraps useMemo to detect excessive recomputations and unstable dependencies.
 */

import { useMemo, useRef } from "react";
import type { DependencyList } from "react";
import type { SafeMemoOptions } from "../types";
import {
  __DEV__,
  createWarning,
  warnOnce,
  createWarningKey,
  useComponentName,
  usePrevious,
  useRenderCount,
  trackDependencyChanges,
  detectUnstableDeps,
} from "../internal";

/** Default threshold for excessive recomputations */
const DEFAULT_RECOMPUTE_THRESHOLD = 10;

/**
 * A safe wrapper around useMemo that detects common issues.
 *
 * In development mode, this hook:
 * - Detects excessive recomputations
 * - Warns when dependencies are unstable
 * - Tracks factory call frequency
 *
 * In production mode, this is identical to useMemo.
 *
 * @param factory - Factory function that computes the memoized value
 * @param deps - Dependency array
 * @param options - Configuration options
 * @returns The memoized value
 *
 * @example
 * ```tsx
 * function ExpensiveList({ items, filter }) {
 *   const filteredItems = useSafeMemo(
 *     () => items.filter((item) => item.matches(filter)),
 *     [items, filter],
 *     { name: "filteredItems", warnOnRecompute: true }
 *   );
 *
 *   return <List items={filteredItems} />;
 * }
 * ```
 */
export function useSafeMemo<T>(
  factory: () => T,
  deps: DependencyList,
  options?: SafeMemoOptions
): T {
  // In production, just use native useMemo
  if (!__DEV__) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return useMemo(factory, deps);
  }

  // Development-only tracking and warnings
  /* eslint-disable react-hooks/rules-of-hooks */
  const componentName = useComponentName();
  const hookName = options?.name ?? "useSafeMemo";
  const renderCount = useRenderCount();
  const prevDeps = usePrevious(deps);
  const recomputeCountRef = useRef(0);

  const warnOnRecompute = options?.warnOnRecompute ?? true;
  const recomputeThreshold = options?.recomputeThreshold ?? DEFAULT_RECOMPUTE_THRESHOLD;

  // Check for dependency array length changes
  if (prevDeps !== undefined) {
    const changes = trackDependencyChanges(deps, prevDeps);

    if (changes.lengthChanged) {
      warnOnce(
        createWarningKey(hookName, "deps-length", componentName),
        createWarning({
          componentName,
          hookName,
          message: "Dependency array length changed between renders.",
          details:
            `Length changed from ${changes.prevLength} to ${changes.currentLength}.`,
          fix:
            "Ensure your dependency array has a stable length. " +
            "Conditional dependencies should be handled inside the factory, not in the array.",
        })
      );
    }

    // Check for unstable dependencies
    const unstableIndices = detectUnstableDeps(deps, prevDeps);
    if (unstableIndices.length > 0 && renderCount > 2) {
      warnOnce(
        createWarningKey(hookName, "unstable-deps", componentName),
        createWarning({
          componentName,
          hookName,
          message: "Potentially unstable dependencies detected.",
          details:
            `Dependencies at indices [${unstableIndices.join(", ")}] appear to be ` +
            "recreated on every render despite having the same content.",
          fix:
            "Memoize objects, arrays, or callbacks with useMemo/useCallback, " +
            "or move them outside the component if they don't depend on props/state.",
        })
      );
    }
  }

  // Wrap factory to track recomputations
  const wrappedFactory = () => {
    recomputeCountRef.current += 1;

    // Check for excessive recomputations
    if (
      warnOnRecompute &&
      recomputeCountRef.current > recomputeThreshold &&
      recomputeCountRef.current === renderCount
    ) {
      warnOnce(
        createWarningKey(hookName, "excessive-recompute", componentName),
        createWarning({
          componentName,
          hookName,
          message: "Memoized value is recomputing on every render.",
          details:
            `The factory has been called ${recomputeCountRef.current} times in ` +
            `${renderCount} renders. This defeats the purpose of memoization.`,
          fix:
            "Check that your dependencies are stable. Avoid inline object/array/function " +
            "literals in the dependency array. If recomputation is intentional, " +
            'set warnOnRecompute: false or increase recomputeThreshold.',
        })
      );
    }

    return factory();
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(wrappedFactory, deps);
  /* eslint-enable react-hooks/rules-of-hooks */

  return value;
}
