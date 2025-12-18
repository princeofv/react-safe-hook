/**
 * Closure tracking utilities.
 *
 * These utilities help detect stale closure issues by tracking
 * values captured by callbacks and comparing them to current values.
 */

import { __DEV__ } from "./devOnly";

/**
 * Result of checking for stale closure issues.
 */
export interface StaleClosureResult {
  /** Whether a potential stale closure was detected */
  isStale: boolean;
  /** Description of the stale closure issue */
  description?: string;
}

/**
 * Tracks callback identity changes and warns about potential issues.
 *
 * @param currentCallback - Current callback function
 * @param prevCallback - Previous callback function
 * @param invokeCount - Number of times the callback has changed
 * @returns Information about callback stability
 */
export interface CallbackStabilityResult {
  /** Whether the callback identity changed */
  identityChanged: boolean;
  /** Total number of identity changes */
  changeCount: number;
  /** Whether the change frequency is concerning */
  isExcessive: boolean;
}

/**
 * Threshold for what's considered "excessive" callback changes.
 * If a callback changes more than this many times, it's likely unstable.
 */
const EXCESSIVE_CHANGE_THRESHOLD = 5;

/**
 * Checks if a callback is changing too frequently, which might indicate
 * that dependencies are missing or the callback is being recreated unnecessarily.
 *
 * @param changeCount - Number of times the callback has changed
 * @param renderCount - Total number of renders
 * @returns Whether the callback is changing excessively
 */
export function isExcessiveCallbackChange(
  changeCount: number,
  renderCount: number
): boolean {
  if (!__DEV__) return false;

  // If callback changes on every render after initial mount, it's likely unstable
  if (renderCount > 2 && changeCount === renderCount) {
    return true;
  }

  // If callback has changed more than the threshold, warn
  if (changeCount > EXCESSIVE_CHANGE_THRESHOLD) {
    return true;
  }

  return false;
}

/**
 * Attempts to detect if a callback might have stale closure references.
 *
 * This is a heuristic check that compares the declared dependencies
 * with values that might be captured in the closure. Due to JavaScript's
 * nature, this can only provide best-effort detection.
 *
 * @param declaredDeps - Dependencies declared in the dependency array
 * @param prevDeps - Dependencies from the previous render
 * @param callbackChanged - Whether the callback reference changed
 * @returns Information about potential stale closures
 */
export function detectStaleClosure(
  declaredDeps: React.DependencyList,
  prevDeps: React.DependencyList | undefined,
  callbackChanged: boolean
): StaleClosureResult {
  if (!__DEV__) {
    return { isStale: false };
  }

  // If callback didn't change but deps did, potential stale closure
  if (!callbackChanged && prevDeps) {
    for (let i = 0; i < declaredDeps.length; i++) {
      if (!Object.is(declaredDeps[i], prevDeps[i])) {
        return {
          isStale: true,
          description:
            `Dependency at index ${i} changed but callback was not updated. ` +
            `This may cause the callback to use stale values.`,
        };
      }
    }
  }

  return { isStale: false };
}

/**
 * Tracks state about a callback for detecting issues over time.
 */
export interface CallbackTracker {
  /** Number of times the callback identity has changed */
  changeCount: number;
  /** Previous callback reference */
  prevCallback: ((...args: unknown[]) => unknown) | undefined;
  /** Previous dependencies */
  prevDeps: React.DependencyList | undefined;
}

/**
 * Creates a new callback tracker.
 *
 * @returns A fresh callback tracker
 */
export function createCallbackTracker(): CallbackTracker {
  return {
    changeCount: 0,
    prevCallback: undefined,
    prevDeps: undefined,
  };
}

/**
 * Updates the callback tracker with new values and returns stability info.
 *
 * @param tracker - The callback tracker to update
 * @param currentCallback - Current callback function
 * @param currentDeps - Current dependencies
 * @param renderCount - Current render count
 * @returns Information about callback stability
 */
export function updateCallbackTracker(
  tracker: CallbackTracker,
  currentCallback: (...args: unknown[]) => unknown,
  currentDeps: React.DependencyList,
  renderCount: number
): CallbackStabilityResult {
  const identityChanged = tracker.prevCallback !== currentCallback;

  if (identityChanged) {
    tracker.changeCount += 1;
  }

  const result: CallbackStabilityResult = {
    identityChanged,
    changeCount: tracker.changeCount,
    isExcessive: isExcessiveCallbackChange(tracker.changeCount, renderCount),
  };

  // Update tracker state
  tracker.prevCallback = currentCallback;
  tracker.prevDeps = currentDeps;

  return result;
}
