/**
 * Dependency array tracking utilities.
 *
 * These utilities help detect common issues with React hook dependency arrays,
 * such as changing lengths and unstable references.
 */

import { __DEV__ } from "./devOnly";

/**
 * Result of comparing two dependency arrays.
 */
export interface DepsChangeResult {
  /** Whether any dependency changed */
  hasChanges: boolean;
  /** Indices of dependencies that changed */
  changedIndices: number[];
  /** Whether the array length changed */
  lengthChanged: boolean;
  /** Previous length (if length changed) */
  prevLength?: number;
  /** Current length (if length changed) */
  currentLength?: number;
}

/**
 * Performs a shallow equality check between two values.
 *
 * @param a - First value
 * @param b - Second value
 * @returns True if values are shallowly equal
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }

  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  ) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Tracks changes between two dependency arrays.
 *
 * @param currentDeps - Current dependency array
 * @param prevDeps - Previous dependency array (from last render)
 * @returns Information about what changed
 *
 * @example
 * ```ts
 * const changes = trackDependencyChanges([a, b, c], [a, oldB, c]);
 * if (changes.hasChanges) {
 *   console.log("Changed indices:", changes.changedIndices); // [1]
 * }
 * ```
 */
export function trackDependencyChanges(
  currentDeps: React.DependencyList | undefined,
  prevDeps: React.DependencyList | undefined
): DepsChangeResult {
  // Handle undefined cases
  if (currentDeps === undefined && prevDeps === undefined) {
    return { hasChanges: false, changedIndices: [], lengthChanged: false };
  }

  if (currentDeps === undefined || prevDeps === undefined) {
    return {
      hasChanges: true,
      changedIndices: [],
      lengthChanged: true,
      prevLength: prevDeps?.length,
      currentLength: currentDeps?.length,
    };
  }

  const changedIndices: number[] = [];
  const lengthChanged = currentDeps.length !== prevDeps.length;

  // Compare each dependency
  const maxLength = Math.max(currentDeps.length, prevDeps.length);
  for (let i = 0; i < maxLength; i++) {
    if (!Object.is(currentDeps[i], prevDeps[i])) {
      changedIndices.push(i);
    }
  }

  return {
    hasChanges: changedIndices.length > 0 || lengthChanged,
    changedIndices,
    lengthChanged,
    prevLength: lengthChanged ? prevDeps.length : undefined,
    currentLength: lengthChanged ? currentDeps.length : undefined,
  };
}

/**
 * Detects if the dependency array length changed between renders.
 *
 * @param currentDeps - Current dependency array
 * @param prevDeps - Previous dependency array
 * @returns True if the length changed
 */
export function detectDepsLengthChange(
  currentDeps: React.DependencyList | undefined,
  prevDeps: React.DependencyList | undefined
): boolean {
  if (currentDeps === undefined && prevDeps === undefined) {
    return false;
  }
  if (currentDeps === undefined || prevDeps === undefined) {
    return true;
  }
  return currentDeps.length !== prevDeps.length;
}

/**
 * Checks if any dependency is an unstable reference (newly created object/array/function).
 * This is a heuristic check that compares object identity.
 *
 * @param currentDeps - Current dependency array
 * @param prevDeps - Previous dependency array
 * @returns Indices of potentially unstable dependencies
 */
export function detectUnstableDeps(
  currentDeps: React.DependencyList,
  prevDeps: React.DependencyList | undefined
): number[] {
  if (!__DEV__ || !prevDeps) {
    return [];
  }

  const unstableIndices: number[] = [];

  for (let i = 0; i < currentDeps.length; i++) {
    const current = currentDeps[i];
    const prev = prevDeps[i];

    // Check if both are objects/functions and have different identity
    // but might have the same content (suggesting unstable reference)
    if (
      current !== prev &&
      typeof current === "object" &&
      current !== null &&
      typeof prev === "object" &&
      prev !== null
    ) {
      // Deep equality check - if equal but different reference, it's unstable
      if (shallowEqual(current, prev)) {
        unstableIndices.push(i);
      }
    }
  }

  return unstableIndices;
}

/**
 * Formats dependency change information for display in warnings.
 *
 * @param changes - The dependency change result
 * @returns A human-readable string describing the changes
 */
export function formatDepsChanges(changes: DepsChangeResult): string {
  if (!changes.hasChanges) {
    return "No changes detected.";
  }

  const parts: string[] = [];

  if (changes.lengthChanged) {
    parts.push(
      `Dependency array length changed from ${changes.prevLength} to ${changes.currentLength}.`
    );
  }

  if (changes.changedIndices.length > 0) {
    const indices = changes.changedIndices.join(", ");
    parts.push(`Dependencies at indices [${indices}] changed.`);
  }

  return parts.join(" ");
}
