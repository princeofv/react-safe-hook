/**
 * useSafeEffect - Effect hook with dependency tracking and safety checks.
 *
 * Wraps useEffect to detect common issues like changing dependency array
 * lengths, missing dependencies, and state updates after unmount.
 */

import { useEffect, useRef } from "react";
import type { EffectCallback, DependencyList } from "react";
import type { SafeEffectOptions } from "../types";
import {
  __DEV__,
  createWarning,
  warn,
  warnOnce,
  createWarningKey,
  useComponentName,
  usePrevious,
  useRenderCount,
  trackDependencyChanges,
  detectUnstableDeps,
  formatDepsChanges,
} from "../internal";

/**
 * A safe wrapper around useEffect that detects common issues.
 *
 * In development mode, this hook:
 * - Detects if the dependency array length changes between renders
 * - Warns about potentially missing dependencies
 * - Tracks cleanup execution correctness
 * - Warns if effect updates state after unmount
 *
 * In production mode, this is identical to useEffect.
 *
 * @param effect - Effect callback (same as useEffect)
 * @param deps - Dependency array (same as useEffect)
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }) {
 *   const [user, setUser] = useSafeState(null);
 *
 *   useSafeEffect(
 *     () => {
 *       fetchUser(userId).then(setUser);
 *     },
 *     [userId],
 *     { name: "fetchUser" }
 *   );
 *
 *   return <div>{user?.name}</div>;
 * }
 * ```
 */
export function useSafeEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options?: SafeEffectOptions
): void {
  // In production, just use native useEffect
  if (!__DEV__) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(effect, deps);
    return;
  }

  // Development-only tracking and warnings
  /* eslint-disable react-hooks/rules-of-hooks */
  const componentName = useComponentName();
  const hookName = options?.name ?? "useSafeEffect";
  const renderCount = useRenderCount();
  const prevDeps = usePrevious(deps);
  const isMountedRef = useRef(true);

  const warnOnMissingDeps = options?.warnOnMissingDeps ?? true;
  const warnOnChangingDeps = options?.warnOnChangingDeps ?? true;

  // Track if deps is omitted (run on every render) - warn once
  if (deps === undefined && warnOnMissingDeps && renderCount === 1) {
    warnOnce(
      createWarningKey(hookName, "no-deps", componentName),
      createWarning({
        componentName,
        hookName,
        message: "Effect has no dependency array.",
        details:
          "This effect will run after every render, which may cause performance issues.",
        fix:
          "Add a dependency array. Use [] for effects that should only run once, " +
          "or list all values from the component scope that the effect uses.",
      })
    );
  }

  // Check for dependency array length changes
  if (warnOnChangingDeps && prevDeps !== undefined && deps !== undefined) {
    const changes = trackDependencyChanges(deps, prevDeps);

    if (changes.lengthChanged) {
      warn(
        createWarning({
          componentName,
          hookName,
          message: "Dependency array length changed between renders.",
          details: formatDepsChanges(changes),
          fix:
            "Ensure your dependency array has a stable length. " +
            "Conditional dependencies should be handled inside the effect, not in the array.",
        })
      );
    }

    // Check for unstable dependencies (objects/arrays recreated each render)
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

  // Track mounted state for unmount warnings
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Wrap the effect to track cleanup and async issues
  useEffect(() => {
    // Execute the effect
    const cleanup = effect();

    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
      // Mark as unmounted for any pending async operations
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  /* eslint-enable react-hooks/rules-of-hooks */
}
