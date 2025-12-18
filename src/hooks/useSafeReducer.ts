/**
 * useSafeReducer - Reducer hook with dispatch safety.
 *
 * Wraps useReducer to warn about dispatches after unmount
 * and track reducer action patterns.
 */

import { useReducer, useCallback, useRef, useEffect, Reducer, Dispatch } from "react";
import {
  __DEV__,
  createWarning,
  warn,
  useComponentName,
} from "../internal";

/**
 * Options for useSafeReducer hook.
 */
export interface SafeReducerOptions {
  /** Name to identify this reducer in warning messages */
  name?: string;
}

/**
 * A safe wrapper around useReducer that warns about dispatches after unmount.
 *
 * In development mode, this hook:
 * - Tracks whether the component is mounted
 * - Warns if dispatch is called after unmount
 * - Provides better debugging context for reducer actions
 *
 * In production mode, this is identical to useReducer.
 *
 * @param reducer - The reducer function
 * @param initialArg - Initial state or argument for initializer
 * @param init - Optional lazy initialization function
 * @param options - Configuration options
 * @returns A tuple of [state, safeDispatch]
 *
 * @example
 * ```tsx
 * const reducer = (state, action) => {
 *   switch (action.type) {
 *     case 'increment': return { count: state.count + 1 };
 *     default: return state;
 *   }
 * };
 *
 * function Counter() {
 *   const [state, dispatch] = useSafeReducer(reducer, { count: 0 });
 *
 *   return (
 *     <button onClick={() => dispatch({ type: 'increment' })}>
 *       {state.count}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSafeReducer<R extends Reducer<unknown, unknown>>(
  reducer: R,
  initialArg: React.ReducerState<R>,
  init?: undefined,
  options?: SafeReducerOptions
): [React.ReducerState<R>, Dispatch<React.ReducerAction<R>>];

export function useSafeReducer<R extends Reducer<unknown, unknown>, I>(
  reducer: R,
  initialArg: I,
  init: (arg: I) => React.ReducerState<R>,
  options?: SafeReducerOptions
): [React.ReducerState<R>, Dispatch<React.ReducerAction<R>>];

export function useSafeReducer<R extends Reducer<unknown, unknown>, I>(
  reducer: R,
  initialArg: I | React.ReducerState<R>,
  init?: ((arg: I) => React.ReducerState<R>) | undefined,
  options?: SafeReducerOptions
): [React.ReducerState<R>, Dispatch<React.ReducerAction<R>>] {
  const [state, dispatch] = init
    ? useReducer(reducer, initialArg as I, init)
    : useReducer(reducer, initialArg as React.ReducerState<R>);

  // In production, just return the native hook
  if (!__DEV__) {
    return [state, dispatch];
  }

  // Development-only tracking
  /* eslint-disable react-hooks/rules-of-hooks */
  const isMountedRef = useRef(true);
  const componentName = useComponentName();
  const hookName = options?.name ?? "useSafeReducer";

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeDispatch = useCallback(
    (action: React.ReducerAction<R>) => {
      if (!isMountedRef.current) {
        warn(
          createWarning({
            componentName,
            hookName,
            message: "Attempted to dispatch action after component unmounted.",
            details:
              `Action type: ${typeof action === "object" && action !== null && "type" in action ? String((action as { type: unknown }).type) : "unknown"}. ` +
              "This usually happens when an async operation completes after " +
              "the component has been removed from the DOM.",
            fix:
              "Use useIsMounted() to check if the component is still mounted " +
              "before dispatching, or cancel the async operation in a cleanup function.",
          })
        );
        return;
      }
      dispatch(action);
    },
    [componentName, hookName]
  );
  /* eslint-enable react-hooks/rules-of-hooks */

  return [state, safeDispatch];
}
