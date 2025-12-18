/**
 * Type definitions for react-safe-hooks.
 */

import type { DependencyList, EffectCallback, Dispatch, SetStateAction } from "react";

/**
 * Options for useSafeEffect hook.
 */
export interface SafeEffectOptions {
  /**
   * Name to identify this effect in warning messages.
   * Uses the component name if not provided.
   */
  name?: string;

  /**
   * Whether to warn when dependencies might be missing.
   * Uses heuristic detection based on closure analysis.
   * @default true
   */
  warnOnMissingDeps?: boolean;

  /**
   * Whether to warn when the dependency array length changes between renders.
   * This is usually a bug as it can cause React to lose track of dependencies.
   * @default true
   */
  warnOnChangingDeps?: boolean;
}

/**
 * Options for useSafeCallback hook.
 */
export interface SafeCallbackOptions {
  /**
   * Name to identify this callback in warning messages.
   * Uses the component name if not provided.
   */
  name?: string;

  /**
   * Whether to warn about potential stale closure issues.
   * @default true
   */
  warnOnStaleClosure?: boolean;
}

/**
 * Options for useSafeMemo hook.
 */
export interface SafeMemoOptions {
  /**
   * Name to identify this memoization in warning messages.
   * Uses the component name if not provided.
   */
  name?: string;

  /**
   * Whether to warn when the factory is recomputing too frequently.
   * This might indicate unstable dependencies.
   * @default true
   */
  warnOnRecompute?: boolean;

  /**
   * Threshold for "excessive" recomputations.
   * Warnings are triggered when recompute count exceeds this.
   * @default 10
   */
  recomputeThreshold?: number;
}

/**
 * Options for useSafeState hook.
 */
export interface SafeStateOptions {
  /**
   * Name to identify this state in warning messages.
   * Uses the component name if not provided.
   */
  name?: string;
}

// Re-export React types for convenience
export type { DependencyList, EffectCallback, Dispatch, SetStateAction };
