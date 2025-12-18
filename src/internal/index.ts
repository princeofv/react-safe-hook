/**
 * Internal utilities barrel export.
 *
 * These utilities are used internally by the safe hooks
 * and should not be exported from the main package.
 */

export { __DEV__, devOnly, devValue } from "./devOnly";

export {
  createWarning,
  warnOnce,
  warn,
  createWarningKey,
  clearWarnings,
  type WarningConfig,
} from "./warn";

export {
  useComponentName,
  usePrevious,
  useRenderCount,
  useIsFirstRender,
} from "./componentName";

export {
  shallowEqual,
  trackDependencyChanges,
  detectDepsLengthChange,
  detectUnstableDeps,
  formatDepsChanges,
  type DepsChangeResult,
} from "./depsTracker";

export {
  isExcessiveCallbackChange,
  detectStaleClosure,
  createCallbackTracker,
  updateCallbackTracker,
  type StaleClosureResult,
  type CallbackStabilityResult,
  type CallbackTracker,
} from "./closureTracker";
