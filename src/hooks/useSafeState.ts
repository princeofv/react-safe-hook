/**
 * useSafeState - State hook with unmount protection.
 *
 * Wraps useState to warn about state updates after unmount
 * and track async misuse patterns.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SafeStateOptions } from "../types";
import {
  __DEV__,
  createWarning,
  warn,
  useComponentName,
} from "../internal";

/**
 * A safe wrapper around useState that warns about updates after unmount.
 *
 * In development mode, this hook:
 * - Tracks whether the component is mounted
 * - Warns if setState is called after the component unmounts
 * - Provides better debugging information for async state updates
 *
 * In production mode, this is identical to useState.
 *
 * @param initialState - Initial state value or initializer function
 * @param options - Configuration options
 * @returns A tuple of [state, safeSetState]
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }) {
 *   const [user, setUser] = useSafeState<User | null>(null);
 *
 *   useEffect(() => {
 *     fetchUser(userId).then((data) => {
 *       setUser(data); // Won't warn if component unmounted
 *     });
 *   }, [userId]);
 *
 *   return <div>{user?.name}</div>;
 * }
 * ```
 */
export function useSafeState<S>(
  initialState: S | (() => S),
  options?: SafeStateOptions
): [S, Dispatch<SetStateAction<S>>];

export function useSafeState<S = undefined>(): [
  S | undefined,
  Dispatch<SetStateAction<S | undefined>>
];

export function useSafeState<S>(
  initialState?: S | (() => S),
  options?: SafeStateOptions
): [S | undefined, Dispatch<SetStateAction<S | undefined>>] {
  const [state, setState] = useState(initialState);

  // In production, just return the native hook
  if (!__DEV__) {
    return [state, setState];
  }

  // Development-only tracking
  /* eslint-disable react-hooks/rules-of-hooks */
  const isMountedRef = useRef(true);
  const componentName = useComponentName();
  const hookName = options?.name ?? "useSafeState";

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback(
    (value: SetStateAction<S | undefined>) => {
      if (!isMountedRef.current) {
        warn(
          createWarning({
            componentName,
            hookName,
            message:
              "Attempted to update state after component unmounted.",
            details:
              "This usually happens when an async operation completes after " +
              "the component has already been removed from the DOM.",
            fix:
              "Use useIsMounted() to check if the component is still mounted " +
              "before calling setState, or cancel the async operation in a cleanup function.",
          })
        );
        return;
      }
      setState(value);
    },
    [componentName, hookName]
  );
  /* eslint-enable react-hooks/rules-of-hooks */

  return [state, safeSetState];
}
