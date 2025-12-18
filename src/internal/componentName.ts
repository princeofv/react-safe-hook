/**
 * Component name detection and render tracking utilities.
 *
 * These utilities help provide better context in warning messages
 * by attempting to identify the component name and track render counts.
 */

import { useRef, useEffect } from "react";
import { __DEV__ } from "./devOnly";

/**
 * Attempts to extract the component name from the React Fiber.
 * This is a best-effort approach that works in most cases but may
 * not always return accurate results.
 *
 * @returns The component name, or "Unknown" if detection fails
 */
export function useComponentName(): string {
  if (!__DEV__) {
    return "Unknown";
  }

  // Best-effort component name detection using Error stack trace
  // This works in development but should be used carefully
  try {
    const stack = new Error().stack;
    if (stack) {
      const lines = stack.split("\n");
      // Look for component function names in the stack
      // Skip the first few entries (Error, useComponentName, hook caller)
      for (let i = 3; i < Math.min(lines.length, 10); i++) {
        const line = lines[i];
        // Match function names that look like React components (PascalCase)
        const match = line.match(/at\s+([A-Z][a-zA-Z0-9_]*)\s*\(/);
        if (match && match[1]) {
          // Filter out known React internals and hook names
          const name = match[1];
          if (
            !name.startsWith("use") &&
            !["Object", "Module", "Array", "Function"].includes(name)
          ) {
            return name;
          }
        }
      }
    }
  } catch {
    // Silently fail - this is best-effort only
  }

  return "Unknown";
}

/**
 * Hook to track the previous value of any variable.
 * Useful for comparing values between renders.
 *
 * @param value - Current value to track
 * @returns The value from the previous render (undefined on first render)
 *
 * @example
 * ```ts
 * const prevCount = usePrevious(count);
 * if (prevCount !== count) {
 *   console.log("Count changed from", prevCount, "to", count);
 * }
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

/**
 * Hook to track how many times a component has rendered.
 * Useful for debugging excessive re-renders.
 *
 * @returns The current render count (starts at 1)
 *
 * @example
 * ```ts
 * const renderCount = useRenderCount();
 * console.log(`Component has rendered ${renderCount} times`);
 * ```
 */
export function useRenderCount(): number {
  const countRef = useRef(0);
  countRef.current += 1;
  return countRef.current;
}

/**
 * Hook that tracks whether this is the first render.
 *
 * @returns True on the first render, false on subsequent renders
 */
export function useIsFirstRender(): boolean {
  const isFirstRef = useRef(true);

  if (isFirstRef.current) {
    isFirstRef.current = false;
    return true;
  }

  return false;
}
