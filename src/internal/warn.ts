/**
 * Warning system for react-safe-hooks.
 *
 * Provides formatted, deduplicated warnings with consistent styling
 * and actionable fix suggestions.
 */

import { __DEV__ } from "./devOnly";

/**
 * Configuration for a warning message.
 */
export interface WarningConfig {
  /** Name of the component where the warning occurred */
  componentName?: string;
  /** Name of the hook that triggered the warning */
  hookName: string;
  /** Main warning message */
  message: string;
  /** Suggested fix for the issue */
  fix?: string;
  /** Additional context or details */
  details?: string;
}

/** Set to track which warnings have already been shown */
const warnedKeys = new Set<string>();

/**
 * Creates a formatted warning message following the react-safe-hooks style.
 *
 * @param config - Warning configuration
 * @returns Formatted warning string
 *
 * @example
 * ```
 * ⚠️ react-safe-hooks warning:
 *
 * Component: UserProfile
 * Hook: useSafeEffect
 *
 * Dependency array length changed between renders.
 * This may cause unexpected behavior.
 *
 * Fix:
 * Ensure your dependency array has a stable length.
 * ```
 */
export function createWarning(config: WarningConfig): string {
  const lines: string[] = [
    "⚠️ react-safe-hooks warning:",
    "",
  ];

  if (config.componentName) {
    lines.push(`Component: ${config.componentName}`);
  }
  lines.push(`Hook: ${config.hookName}`);
  lines.push("");
  lines.push(config.message);

  if (config.details) {
    lines.push(config.details);
  }

  if (config.fix) {
    lines.push("");
    lines.push("Fix:");
    lines.push(config.fix);
  }

  return lines.join("\n");
}

/**
 * Logs a warning to the console, but only once per unique key.
 * Useful to prevent spamming the console with repeated warnings.
 *
 * @param key - Unique identifier for this warning (e.g., component + hook + issue)
 * @param message - Warning message to display
 *
 * @example
 * ```ts
 * warnOnce("UserProfile:useSafeEffect:deps-length", warningMessage);
 * ```
 */
export function warnOnce(key: string, message: string): void {
  if (!__DEV__) return;

  if (warnedKeys.has(key)) {
    return;
  }

  warnedKeys.add(key);
  console.warn(message);
}

/**
 * Logs a warning to the console immediately.
 * Use this for warnings that should be shown every time they occur.
 *
 * @param message - Warning message to display
 */
export function warn(message: string): void {
  if (!__DEV__) return;
  console.warn(message);
}

/**
 * Creates a unique key for deduplication based on warning context.
 *
 * @param hookName - Name of the hook
 * @param issueType - Type of issue being warned about
 * @param componentName - Optional component name
 * @returns Unique key string
 */
export function createWarningKey(
  hookName: string,
  issueType: string,
  componentName?: string
): string {
  return `${componentName || "Unknown"}:${hookName}:${issueType}`;
}

/**
 * Clears all tracked warnings.
 * Useful for testing or resetting state.
 */
export function clearWarnings(): void {
  warnedKeys.clear();
}
