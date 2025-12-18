/**
 * Environment detection for development-only code.
 *
 * This module provides utilities to ensure that development-only
 * logic is completely stripped from production builds.
 */

/**
 * Development mode flag.
 * This will be replaced with `false` by bundlers in production builds,
 * allowing tree-shaking to remove dev-only code paths.
 */
export const __DEV__ = process.env.NODE_ENV !== "production";

/**
 * Execute a function only in development mode.
 * In production, this returns undefined and the function is never called.
 *
 * @param fn - Function to execute in development mode
 * @returns The result of the function in dev mode, undefined in production
 *
 * @example
 * ```ts
 * devOnly(() => {
 *   console.warn("This only runs in development");
 * });
 * ```
 */
export function devOnly<T>(fn: () => T): T | undefined {
  if (__DEV__) {
    return fn();
  }
  return undefined;
}

/**
 * Wraps a value to be used only in development mode.
 * Returns undefined in production.
 *
 * @param value - Value to wrap
 * @returns The value in dev mode, undefined in production
 */
export function devValue<T>(value: T): T | undefined {
  if (__DEV__) {
    return value;
  }
  return undefined;
}
