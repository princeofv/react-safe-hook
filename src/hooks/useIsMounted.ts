/**
 * useIsMounted - Track component mounted state safely.
 *
 * This hook provides a stable function that returns whether the component
 * is currently mounted. Useful for preventing state updates after unmount.
 */

import { useRef, useCallback, useEffect } from "react";

/**
 * Returns a stable function that indicates whether the component is mounted.
 *
 * Use this to guard async operations that might complete after the component
 * unmounts, preventing the "setState on unmounted component" warning.
 *
 * @returns A stable function that returns true if mounted, false otherwise
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }) {
 *   const isMounted = useIsMounted();
 *   const [user, setUser] = useState(null);
 *
 *   useEffect(() => {
 *     fetchUser(userId).then((data) => {
 *       if (isMounted()) {
 *         setUser(data);
 *       }
 *     });
 *   }, [userId, isMounted]);
 *
 *   return <div>{user?.name}</div>;
 * }
 * ```
 */
export function useIsMounted(): () => boolean {
  const isMountedRef = useRef(false);

  // Set mounted on mount, clear on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Return a stable callback that reads the ref
  const isMounted = useCallback(() => isMountedRef.current, []);

  return isMounted;
}
