/**
 * useSafeContext - Context hook with missing provider warnings.
 *
 * Wraps useContext to provide better error messages when
 * context is used outside its provider.
 */

import { useContext, Context } from "react";
import {
  __DEV__,
  createWarning,
  warn,
  useComponentName,
} from "../internal";

/**
 * Options for useSafeContext hook.
 */
export interface SafeContextOptions {
  /** Name to identify this context in warning messages */
  name?: string;
  /** Whether to throw an error instead of just warning - default false */
  throwOnMissing?: boolean;
}

/**
 * A safe wrapper around useContext that provides better error messages.
 *
 * In development mode, this hook:
 * - Warns if context value appears to be the default (missing provider)
 * - Provides component name in error messages
 * - Can optionally throw instead of just warning
 *
 * In production mode, this is identical to useContext.
 *
 * @param context - The React context to consume
 * @param options - Configuration options
 * @returns The context value
 *
 * @example
 * ```tsx
 * const ThemeContext = React.createContext<Theme | undefined>(undefined);
 *
 * function ThemedButton() {
 *   const theme = useSafeContext(ThemeContext, {
 *     name: "ThemeContext",
 *     throwOnMissing: true
 *   });
 *
 *   if (!theme) {
 *     // This won't happen if throwOnMissing is true
 *     return null;
 *   }
 *
 *   return <button style={{ color: theme.primary }}>Click</button>;
 * }
 * ```
 */
export function useSafeContext<T>(
  context: Context<T>,
  options?: SafeContextOptions
): T {
  const value = useContext(context);

  // In production, just return the value
  if (!__DEV__) {
    return value;
  }

  /* eslint-disable react-hooks/rules-of-hooks */
  const componentName = useComponentName();
  const hookName = options?.name ?? "useSafeContext";
  const throwOnMissing = options?.throwOnMissing ?? false;

  // Check if value is undefined (common pattern for "no provider")
  if (value === undefined) {
    const message = createWarning({
      componentName,
      hookName,
      message: "Context value is undefined. This usually means the component is not wrapped in a Provider.",
      details:
        "Make sure the component that uses this context is a descendant of the corresponding Provider.",
      fix:
        "Wrap your component tree with the appropriate context provider, " +
        "or check that you're importing the correct context.",
    });

    if (throwOnMissing) {
      throw new Error(message);
    } else {
      warn(message);
    }
  }
  /* eslint-enable react-hooks/rules-of-hooks */

  return value;
}
