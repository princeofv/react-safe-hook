/**
 * react-safe-hooks
 *
 * Runtime-safe React hooks that warn developers about common hook misuse,
 * stale closures, incorrect dependencies, and unsafe async state updates
 * — without affecting production builds.
 *
 * @packageDocumentation
 */

// Export all hooks
export { useIsMounted } from "./hooks/useIsMounted";
export { useSafeState } from "./hooks/useSafeState";
export { useSafeEffect } from "./hooks/useSafeEffect";
export { useSafeCallback } from "./hooks/useSafeCallback";
export { useSafeMemo } from "./hooks/useSafeMemo";
export { useSafeRef } from "./hooks/useSafeRef";
export { useSafeLayoutEffect } from "./hooks/useSafeLayoutEffect";
export { useSafeReducer } from "./hooks/useSafeReducer";
export { useSafeContext } from "./hooks/useSafeContext";

// Export types
export type {
  SafeEffectOptions,
  SafeCallbackOptions,
  SafeMemoOptions,
  SafeStateOptions,
} from "./types";

export type { SafeRefOptions } from "./hooks/useSafeRef";
export type { SafeLayoutEffectOptions } from "./hooks/useSafeLayoutEffect";
export type { SafeReducerOptions } from "./hooks/useSafeReducer";
export type { SafeContextOptions } from "./hooks/useSafeContext";

// Export dev utilities for advanced usage
export { __DEV__ } from "./internal/devOnly";

