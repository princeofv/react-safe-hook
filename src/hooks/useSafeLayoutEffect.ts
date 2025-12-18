/**
 * useSafeLayoutEffect - Layout effect hook with SSR safety.
 *
 * Wraps useLayoutEffect with SSR compatibility and warnings
 * about common misuse patterns.
 */

import { useLayoutEffect, useEffect, useRef } from "react";
import type { EffectCallback, DependencyList } from "react";
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
 * Options for useSafeLayoutEffect hook.
 */
export interface SafeLayoutEffectOptions {
  /** Name to identify this effect in warning messages */
  name?: string;
  /** Whether to warn on missing deps - default true */
  warnOnMissingDeps?: boolean;
  /** Whether to warn on changing deps length - default true */
  warnOnChangingDeps?: boolean;
}

/**
 * Detect if we're in a server environment.
 */
const canUseDOM = !!(
  typeof window !== "undefined" &&
  window.document &&
  window.document.createElement
);

/**
 * SSR-safe useLayoutEffect that falls back to useEffect on the server.
 * Includes the same dev-time checks as useSafeEffect.
 *
 * In development mode, this hook:
 * - Falls back to useEffect during SSR to avoid warnings
 * - Detects dependency array length changes
 * - Warns about missing dependencies
 *
 * In production mode, this falls back to useEffect in SSR,
 * and uses useLayoutEffect in the browser.
 *
 * @param effect - Layout effect callback
 * @param deps - Dependency array
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function Modal({ isOpen }) {
 *   const modalRef = useSafeRef<HTMLDivElement>(null);
 *
 *   useSafeLayoutEffect(() => {
 *     if (isOpen && modalRef.current) {
 *       // Measure and position before paint
 *       const rect = modalRef.current.getBoundingClientRect();
 *       // ...
 *     }
 *   }, [isOpen]);
 *
 *   return <div ref={modalRef}>...</div>;
 * }
 * ```
 */
export function useSafeLayoutEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options?: SafeLayoutEffectOptions
): void {
  // Use useEffect on server to avoid SSR warnings
  const useIsomorphicLayoutEffect = canUseDOM ? useLayoutEffect : useEffect;

  // In production, just use the isomorphic effect
  if (!__DEV__) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useIsomorphicLayoutEffect(effect, deps);
    return;
  }

  // Development-only tracking and warnings
  /* eslint-disable react-hooks/rules-of-hooks */
  const componentName = useComponentName();
  const hookName = options?.name ?? "useSafeLayoutEffect";
  const renderCount = useRenderCount();
  const prevDeps = usePrevious(deps);
  const isMountedRef = useRef(true);

  const warnOnMissingDeps = options?.warnOnMissingDeps ?? true;
  const warnOnChangingDeps = options?.warnOnChangingDeps ?? true;

  // Warn about missing dependency array
  if (deps === undefined && warnOnMissingDeps && renderCount === 1) {
    warnOnce(
      createWarningKey(hookName, "no-deps", componentName),
      createWarning({
        componentName,
        hookName,
        message: "Layout effect has no dependency array.",
        details:
          "This effect will run after every render, which may cause performance issues " +
          "and layout thrashing.",
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

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Execute the layout effect
  useIsomorphicLayoutEffect(() => {
    const cleanup = effect();

    return () => {
      if (typeof cleanup === "function") {
        cleanup();
      }
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  /* eslint-enable react-hooks/rules-of-hooks */
}
