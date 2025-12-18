/**
 * useSafeCallback - Callback hook with stale closure detection.
 *
 * Wraps useCallback to detect stale closures, unstable dependencies,
 * and excessive callback identity changes.
 */

import { useCallback, useRef } from "react";
import type { DependencyList } from "react";
import type { SafeCallbackOptions } from "../types";
import {
  __DEV__,
  createWarning,
  warnOnce,
  createWarningKey,
  useComponentName,
  usePrevious,
  useRenderCount,
  detectStaleClosure,
  isExcessiveCallbackChange,
  detectUnstableDeps,
} from "../internal";

/**
 * A safe wrapper around useCallback that detects common issues.
 *
 * In development mode, this hook:
 * - Detects potential stale closure issues
 * - Warns if the dependency array is unstable
 * - Warns if the callback identity changes too frequently
 * - Provides a stable reference (same as useCallback)
 *
 * In production mode, this is identical to useCallback.
 *
 * @param callback - Callback function to memoize
 * @param deps - Dependency array
 * @param options - Configuration options
 * @returns Memoized callback function
 *
 * @example
 * ```tsx
 * function SearchInput({ onSearch }) {
 *   const [query, setQuery] = useState("");
 *
 *   const handleSearch = useSafeCallback(
 *     () => {
 *       onSearch(query);
 *     },
 *     [query, onSearch],
 *     { name: "handleSearch" }
 *   );
 *
 *   return (
 *     <input
 *       value={query}
 *       onChange={(e) => setQuery(e.target.value)}
 *       onBlur={handleSearch}
 *     />
 *   );
 * }
 * ```
 */
export function useSafeCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: DependencyList,
  options?: SafeCallbackOptions
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCallback = useCallback(callback, deps);

  // In production, just return the memoized callback
  if (!__DEV__) {
    return memoizedCallback;
  }

  // Development-only tracking and warnings
  /* eslint-disable react-hooks/rules-of-hooks */
  const componentName = useComponentName();
  const hookName = options?.name ?? "useSafeCallback";
  const renderCount = useRenderCount();
  const prevDeps = usePrevious(deps);
  const prevCallbackRef = useRef<T | undefined>(undefined);
  const changeCountRef = useRef(0);

  const warnOnStaleClosure = options?.warnOnStaleClosure ?? true;

  // Track callback identity changes
  if (prevCallbackRef.current !== memoizedCallback) {
    changeCountRef.current += 1;
    prevCallbackRef.current = memoizedCallback;
  }

  // Check for stale closure issues
  if (warnOnStaleClosure && prevDeps !== undefined) {
    const staleResult = detectStaleClosure(
      deps,
      prevDeps,
      changeCountRef.current > 1
    );

    if (staleResult.isStale) {
      warnOnce(
        createWarningKey(hookName, "stale-closure", componentName),
        createWarning({
          componentName,
          hookName,
          message: "Potential stale closure detected.",
          details: staleResult.description,
          fix:
            "Make sure all values used inside the callback are included in the " +
            "dependency array. If you're intentionally using stale values, " +
            "consider using a ref instead.",
        })
      );
    }
  }

  // Check for unstable dependencies
  if (prevDeps !== undefined) {
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
            "Memoize objects, arrays, or callbacks in dependencies with useMemo/useCallback, " +
            "or move them outside the component if they don't depend on props/state.",
        })
      );
    }
  }

  // Check for excessive callback changes
  if (isExcessiveCallbackChange(changeCountRef.current, renderCount)) {
    warnOnce(
      createWarningKey(hookName, "excessive-changes", componentName),
      createWarning({
        componentName,
        hookName,
        message: "Callback is changing too frequently.",
        details:
          `The callback has changed ${changeCountRef.current} times in ${renderCount} renders. ` +
          "This defeats the purpose of memoization and may cause unnecessary re-renders in child components.",
        fix:
          "Check that all dependencies are stable. Avoid inline object/array/function " +
          "literals in the dependency array. Consider if memoization is even needed.",
      })
    );
  }
  /* eslint-enable react-hooks/rules-of-hooks */

  return memoizedCallback;
}
