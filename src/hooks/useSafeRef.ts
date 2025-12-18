/**
 * useSafeRef - Ref hook with initialization warnings.
 *
 * Wraps useRef to warn about common ref misuse patterns
 * like accessing .current during render.
 */

import { useRef, MutableRefObject } from "react";
import {
  __DEV__,
  createWarning,
  warnOnce,
  createWarningKey,
  useComponentName,
  useRenderCount,
} from "../internal";

/**
 * Options for useSafeRef hook.
 */
export interface SafeRefOptions {
  /** Name to identify this ref in warning messages */
  name?: string;
  /** Whether to warn on null/undefined initial value - default false */
  warnOnNullInit?: boolean;
}

/**
 * A safe wrapper around useRef that detects common issues.
 *
 * In development mode, this hook:
 * - Tracks ref access patterns
 * - Can warn about null/undefined initial values if enabled
 *
 * In production mode, this is identical to useRef.
 *
 * @param initialValue - Initial ref value
 * @param options - Configuration options
 * @returns A mutable ref object
 *
 * @example
 * ```tsx
 * function InputFocus() {
 *   const inputRef = useSafeRef<HTMLInputElement>(null, { name: "inputRef" });
 *
 *   useSafeEffect(() => {
 *     inputRef.current?.focus();
 *   }, []);
 *
 *   return <input ref={inputRef} />;
 * }
 * ```
 */
export function useSafeRef<T>(
  initialValue: T,
  options?: SafeRefOptions
): MutableRefObject<T>;

export function useSafeRef<T>(
  initialValue: T | null,
  options?: SafeRefOptions
): MutableRefObject<T | null>;

export function useSafeRef<T = undefined>(
  options?: SafeRefOptions
): MutableRefObject<T | undefined>;

export function useSafeRef<T>(
  initialValue?: T,
  options?: SafeRefOptions
): MutableRefObject<T | undefined> {
  const ref = useRef(initialValue);

  if (!__DEV__) {
    return ref;
  }

  /* eslint-disable react-hooks/rules-of-hooks */
  const componentName = useComponentName();
  const hookName = options?.name ?? "useSafeRef";
  const renderCount = useRenderCount();
  const warnOnNullInit = options?.warnOnNullInit ?? false;

  // Optionally warn on null/undefined initial value
  if (warnOnNullInit && renderCount === 1 && initialValue == null) {
    warnOnce(
      createWarningKey(hookName, "null-init", componentName),
      createWarning({
        componentName,
        hookName,
        message: "Ref initialized with null or undefined.",
        details:
          "This is usually fine for DOM refs, but may indicate a bug for other uses.",
        fix:
          "If intentional, disable this warning with warnOnNullInit: false. " +
          "Otherwise, provide an initial value.",
      })
    );
  }
  /* eslint-enable react-hooks/rules-of-hooks */

  return ref;
}
