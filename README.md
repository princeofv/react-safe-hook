# react-safe-hooks

> Runtime-safe React hooks that warn developers about common hook misuse, stale closures, incorrect dependencies, and unsafe async state updates — without affecting production builds.

[![npm version](https://img.shields.io/npm/v/react-safe-hooks.svg)](https://www.npmjs.com/package/react-safe-hooks)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb.svg)](https://reactjs.org/)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-green.svg)](package.json)

## Why react-safe-hooks?

ESLint's `react-hooks/exhaustive-deps` rule catches many issues statically, but some problems only manifest at runtime:

| Problem | ESLint | react-safe-hooks |
|---------|--------|------------------|
| Stale closures from missing deps | ⚠️ Sometimes | ✅ Runtime detection |
| Dependency array length changes | ❌ No | ✅ Detects |
| State updates after unmount | ❌ No | ✅ Warns |
| Unstable reference recreations | ❌ No | ✅ Heuristic detection |
| Excessive recomputations | ❌ No | ✅ Tracks |
| Missing context providers | ❌ No | ✅ Warns |
| SSR layout effect issues | ❌ No | ✅ Auto-fallback |

**Zero production cost**: All validation logic is completely stripped in production builds.

## Installation

```bash
npm install react-safe-hooks
# or
yarn add react-safe-hooks
# or
pnpm add react-safe-hooks
```

## Quick Start

Simply replace your hooks with their safe counterparts:

```tsx
import {
  useSafeState,
  useSafeEffect,
  useSafeCallback,
  useSafeMemo,
  useIsMounted,
} from 'react-safe-hooks';

function UserProfile({ userId }) {
  const [user, setUser] = useSafeState(null);
  const isMounted = useIsMounted();

  useSafeEffect(() => {
    fetchUser(userId).then((data) => {
      if (isMounted()) {
        setUser(data);
      }
    });
  }, [userId, isMounted]);

  const handleSave = useSafeCallback(() => {
    saveUser(user);
  }, [user]);

  const fullName = useSafeMemo(
    () => `${user?.firstName} ${user?.lastName}`,
    [user?.firstName, user?.lastName]
  );

  return <div>{fullName}</div>;
}
```

## All Available Hooks

| Hook | Replaces | Key Features |
|------|----------|--------------|
| `useSafeState` | `useState` | Unmount protection |
| `useSafeEffect` | `useEffect` | Dependency tracking |
| `useSafeCallback` | `useCallback` | Stale closure detection |
| `useSafeMemo` | `useMemo` | Recompute tracking |
| `useSafeRef` | `useRef` | Initialization warnings |
| `useSafeLayoutEffect` | `useLayoutEffect` | SSR safe + tracking |
| `useSafeReducer` | `useReducer` | Dispatch protection |
| `useSafeContext` | `useContext` | Missing provider detection |
| `useIsMounted` | - | Mounted state tracking |

---

## Hooks API & Examples

### useSafeState

```tsx
const [state, setState] = useSafeState(initialState, options?: {
  name?: string; // Identifier in warnings
});
```

**Detects:**
- ⚠️ setState called after component unmount
- ⚠️ Async state update patterns that may cause issues

**Example: Async Data Fetching**

```tsx
function UserCard({ userId }) {
  const [user, setUser] = useSafeState<User | null>(null);
  const [loading, setLoading] = useSafeState(true);
  const [error, setError] = useSafeState<string | null>(null);

  useSafeEffect(() => {
    let cancelled = false;
    
    setLoading(true);
    setError(null);
    
    fetchUser(userId)
      .then((data) => {
        if (!cancelled) {
          setUser(data);    // Safe! Warns if component unmounted
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  return <Card user={user} />;
}
```

---

### useSafeEffect

```tsx
useSafeEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options?: {
    name?: string;              // Identifier in warnings
    warnOnMissingDeps?: boolean; // Default: true
    warnOnChangingDeps?: boolean; // Default: true
  }
)
```

**Detects:**
- ⚠️ Missing dependency array
- ⚠️ Dependency array length changes between renders
- ⚠️ Unstable dependencies (objects/arrays recreated each render)

**Example: WebSocket Connection**

```tsx
function ChatRoom({ roomId, userId }) {
  const [messages, setMessages] = useSafeState<Message[]>([]);
  const isMounted = useIsMounted();

  useSafeEffect(() => {
    const socket = new WebSocket(`/chat/${roomId}`);
    
    socket.onmessage = (event) => {
      if (isMounted()) {
        setMessages((prev) => [...prev, JSON.parse(event.data)]);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup: close socket when roomId changes or unmount
    return () => {
      socket.close();
    };
  }, [roomId, isMounted], { name: 'WebSocketConnection' });

  return <MessageList messages={messages} />;
}
```

**Example: Document Title**

```tsx
function PageTitle({ title }) {
  useSafeEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title], { name: 'DocumentTitle' });

  return null;
}
```

---

### useSafeCallback

```tsx
const fn = useSafeCallback(
  callback: (...args: any[]) => any,
  deps: DependencyList,
  options?: {
    name?: string;               // Identifier in warnings
    warnOnStaleClosure?: boolean; // Default: true
  }
);
```

**Detects:**
- ⚠️ Potential stale closures
- ⚠️ Unstable dependencies
- ⚠️ Excessive callback identity changes

**Example: Debounced Search**

```tsx
function SearchInput({ onSearch }) {
  const [query, setQuery] = useSafeState('');

  const debouncedSearch = useSafeCallback(
    debounce((searchQuery: string) => {
      onSearch(searchQuery);
    }, 300),
    [onSearch],
    { name: 'debouncedSearch' }
  );

  const handleChange = useSafeCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      debouncedSearch(value);
    },
    [debouncedSearch],
    { name: 'handleChange' }
  );

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search..."
    />
  );
}
```

**Example: Event Handler with Props**

```tsx
function TodoItem({ todo, onToggle, onDelete }) {
  // These callbacks are stable unless their deps change
  const handleToggle = useSafeCallback(() => {
    onToggle(todo.id);
  }, [todo.id, onToggle]);

  const handleDelete = useSafeCallback(() => {
    if (confirm('Delete this item?')) {
      onDelete(todo.id);
    }
  }, [todo.id, onDelete]);

  return (
    <li>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={handleToggle}
      />
      <span>{todo.text}</span>
      <button onClick={handleDelete}>×</button>
    </li>
  );
}
```

---

### useSafeMemo

```tsx
const value = useSafeMemo(
  factory: () => T,
  deps: DependencyList,
  options?: {
    name?: string;             // Identifier in warnings
    warnOnRecompute?: boolean; // Default: true
    recomputeThreshold?: number; // Default: 10
  }
);
```

**Detects:**
- ⚠️ Excessive recomputations
- ⚠️ Unstable dependencies
- ⚠️ Dependency array length changes

**Example: Expensive Filtering**

```tsx
function ProductList({ products, filters }) {
  const filteredProducts = useSafeMemo(() => {
    console.log('Filtering products...'); // See when this runs
    
    return products.filter((product) => {
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      if (filters.minPrice && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && product.price > filters.maxPrice) {
        return false;
      }
      if (filters.inStock && !product.inStock) {
        return false;
      }
      return true;
    });
  }, [products, filters.category, filters.minPrice, filters.maxPrice, filters.inStock], {
    name: 'filteredProducts',
    recomputeThreshold: 5,
  });

  return (
    <ul>
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ul>
  );
}
```

**Example: Derived State**

```tsx
function OrderSummary({ items }) {
  const subtotal = useSafeMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
    { name: 'subtotal' }
  );

  const tax = useSafeMemo(
    () => subtotal * 0.08,
    [subtotal],
    { name: 'tax' }
  );

  const total = useSafeMemo(
    () => subtotal + tax,
    [subtotal, tax],
    { name: 'total' }
  );

  return (
    <div>
      <p>Subtotal: ${subtotal.toFixed(2)}</p>
      <p>Tax: ${tax.toFixed(2)}</p>
      <p><strong>Total: ${total.toFixed(2)}</strong></p>
    </div>
  );
}
```

---

### useSafeRef

```tsx
const ref = useSafeRef<T>(initialValue, options?: {
  name?: string;           // Identifier in warnings
  warnOnNullInit?: boolean; // Default: false
});
```

**Example: DOM Element Reference**

```tsx
function AutoFocusInput({ autoFocus }) {
  const inputRef = useSafeRef<HTMLInputElement>(null, { name: 'inputRef' });

  useSafeEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return <input ref={inputRef} type="text" />;
}
```

**Example: Previous Value Tracking**

```tsx
function CounterWithHistory() {
  const [count, setCount] = useSafeState(0);
  const prevCountRef = useSafeRef(count, { name: 'prevCount' });

  useSafeEffect(() => {
    prevCountRef.current = count;
  }, [count]);

  return (
    <div>
      <p>Current: {count}</p>
      <p>Previous: {prevCountRef.current}</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}
```

---

### useSafeLayoutEffect

```tsx
useSafeLayoutEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options?: {
    name?: string;
    warnOnMissingDeps?: boolean;
    warnOnChangingDeps?: boolean;
  }
)
```

SSR-safe version of useLayoutEffect that falls back to useEffect on the server.

**Example: Tooltip Positioning**

```tsx
function Tooltip({ targetRef, content }) {
  const tooltipRef = useSafeRef<HTMLDivElement>(null);
  const [position, setPosition] = useSafeState({ top: 0, left: 0 });

  useSafeLayoutEffect(() => {
    if (targetRef.current && tooltipRef.current) {
      const targetRect = targetRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      setPosition({
        top: targetRect.top - tooltipRect.height - 8,
        left: targetRect.left + (targetRect.width - tooltipRect.width) / 2,
      });
    }
  }, [targetRef], { name: 'tooltipPosition' });

  return (
    <div
      ref={tooltipRef}
      className="tooltip"
      style={{ top: position.top, left: position.left }}
    >
      {content}
    </div>
  );
}
```

**Example: Scroll Lock**

```tsx
function Modal({ isOpen, children }) {
  useSafeLayoutEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen], { name: 'scrollLock' });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">{children}</div>
    </div>
  );
}
```

---

### useSafeReducer

```tsx
const [state, dispatch] = useSafeReducer(reducer, initialState, init?, options?: {
  name?: string; // Identifier in warnings
});
```

**Detects:**
- ⚠️ Dispatch called after component unmount

**Example: Todo App**

```tsx
type TodoAction =
  | { type: 'ADD'; text: string }
  | { type: 'TOGGLE'; id: number }
  | { type: 'DELETE'; id: number }
  | { type: 'CLEAR_COMPLETED' };

interface TodoState {
  todos: Array<{ id: number; text: string; completed: boolean }>;
  nextId: number;
}

function todoReducer(state: TodoState, action: TodoAction): TodoState {
  switch (action.type) {
    case 'ADD':
      return {
        ...state,
        todos: [...state.todos, { id: state.nextId, text: action.text, completed: false }],
        nextId: state.nextId + 1,
      };
    case 'TOGGLE':
      return {
        ...state,
        todos: state.todos.map((t) =>
          t.id === action.id ? { ...t, completed: !t.completed } : t
        ),
      };
    case 'DELETE':
      return {
        ...state,
        todos: state.todos.filter((t) => t.id !== action.id),
      };
    case 'CLEAR_COMPLETED':
      return {
        ...state,
        todos: state.todos.filter((t) => !t.completed),
      };
    default:
      return state;
  }
}

function TodoApp() {
  const [state, dispatch] = useSafeReducer(
    todoReducer,
    { todos: [], nextId: 1 },
    undefined,
    { name: 'todoReducer' }
  );
  const [input, setInput] = useSafeState('');

  const handleSubmit = useSafeCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      dispatch({ type: 'ADD', text: input.trim() });
      setInput('');
    }
  }, [input]);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit">Add</button>
      </form>
      <ul>
        {state.todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => dispatch({ type: 'TOGGLE', id: todo.id })}
            />
            {todo.text}
            <button onClick={() => dispatch({ type: 'DELETE', id: todo.id })}>×</button>
          </li>
        ))}
      </ul>
      <button onClick={() => dispatch({ type: 'CLEAR_COMPLETED' })}>
        Clear Completed
      </button>
    </div>
  );
}
```

---

### useSafeContext

```tsx
const value = useSafeContext(Context, options?: {
  name?: string;           // Identifier in warnings
  throwOnMissing?: boolean; // Default: false
});
```

**Detects:**
- ⚠️ Context used outside its Provider
- ⚠️ Undefined context values

**Example: Theme Context**

```tsx
interface Theme {
  primary: string;
  secondary: string;
  background: string;
}

const ThemeContext = React.createContext<Theme | undefined>(undefined);

function ThemeProvider({ children }) {
  const theme = useSafeMemo(() => ({
    primary: '#007bff',
    secondary: '#6c757d',
    background: '#ffffff',
  }), []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

function ThemedButton({ children }) {
  // Will warn in dev if used outside ThemeProvider
  const theme = useSafeContext(ThemeContext, {
    name: 'ThemeContext',
    throwOnMissing: true, // Throw error instead of just warning
  });

  return (
    <button style={{ backgroundColor: theme.primary, color: '#fff' }}>
      {children}
    </button>
  );
}
```

**Example: Auth Context**

```tsx
interface AuthContextValue {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

function useAuth() {
  return useSafeContext(AuthContext, {
    name: 'AuthContext',
    throwOnMissing: true,
  });
}

function UserMenu() {
  const { user, logout } = useAuth();

  if (!user) {
    return <LoginButton />;
  }

  return (
    <div>
      <span>Welcome, {user.name}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

### useIsMounted

```tsx
const isMounted = useIsMounted();
// isMounted() returns true if component is mounted
```

A stable function reference that returns whether the component is currently mounted. Use this to guard async operations.

**Example: Abort Controller Pattern**

```tsx
function DataFetcher({ url }) {
  const [data, setData] = useSafeState(null);
  const [error, setError] = useSafeState(null);
  const isMounted = useIsMounted();

  useSafeEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((res) => res.json())
      .then((json) => {
        if (isMounted()) {
          setData(json);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError' && isMounted()) {
          setError(err);
        }
      });

    return () => {
      controller.abort();
    };
  }, [url, isMounted]);

  return <div>{JSON.stringify(data)}</div>;
}
```

---

## Real-World Example: Complete Form Component

```tsx
import {
  useSafeState,
  useSafeEffect,
  useSafeCallback,
  useSafeMemo,
  useSafeReducer,
  useIsMounted,
} from 'react-safe-hooks';

interface FormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
}

type FormAction =
  | { type: 'SET_FIELD'; field: string; value: string }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'TOUCH_FIELD'; field: string }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'RESET' };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: '' },
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.error },
      };
    case 'TOUCH_FIELD':
      return {
        ...state,
        touched: { ...state.touched, [action.field]: true },
      };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.value };
    case 'RESET':
      return {
        values: {},
        errors: {},
        touched: {},
        isSubmitting: false,
      };
    default:
      return state;
  }
}

function ContactForm({ onSubmit }) {
  const [state, dispatch] = useSafeReducer(
    formReducer,
    { values: {}, errors: {}, touched: {}, isSubmitting: false },
    undefined,
    { name: 'contactForm' }
  );
  const [submitError, setSubmitError] = useSafeState<string | null>(null);
  const isMounted = useIsMounted();

  const isValid = useSafeMemo(() => {
    const { email, message } = state.values;
    return email?.includes('@') && message?.length > 10;
  }, [state.values.email, state.values.message], { name: 'isValid' });

  const handleChange = useSafeCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_FIELD', field, value: e.target.value });
  }, []);

  const handleBlur = useSafeCallback((field: string) => () => {
    dispatch({ type: 'TOUCH_FIELD', field });
  }, []);

  const handleSubmit = useSafeCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) return;

    dispatch({ type: 'SET_SUBMITTING', value: true });
    setSubmitError(null);

    try {
      await onSubmit(state.values);
      if (isMounted()) {
        dispatch({ type: 'RESET' });
      }
    } catch (err) {
      if (isMounted()) {
        setSubmitError(err.message);
        dispatch({ type: 'SET_SUBMITTING', value: false });
      }
    }
  }, [isValid, state.values, onSubmit, isMounted]);

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={state.values.email || ''}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
      />
      {state.touched.email && state.errors.email && (
        <span className="error">{state.errors.email}</span>
      )}

      <textarea
        placeholder="Message"
        value={state.values.message || ''}
        onChange={handleChange('message')}
        onBlur={handleBlur('message')}
      />

      {submitError && <div className="error">{submitError}</div>}

      <button type="submit" disabled={!isValid || state.isSubmitting}>
        {state.isSubmitting ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
}
```

---

## Warning Messages

All warnings follow a consistent format:

```
⚠️ react-safe-hooks warning:

Component: UserProfile
Hook: useSafeEffect

Dependency array length changed between renders.
Length changed from 2 to 3.

Fix:
Ensure your dependency array has a stable length.
Conditional dependencies should be handled inside the effect, not in the array.
```

### Common Warnings Explained

#### "Effect has no dependency array"

```tsx
// ❌ Bad: Runs on every render
useSafeEffect(() => {
  console.log('This runs too often');
});

// ✅ Good: Explicit about when to run
useSafeEffect(() => {
  console.log('Runs once');
}, []);
```

#### "Dependency array length changed"

```tsx
// ❌ Bad: Conditional dependency
useSafeEffect(() => {
  // ...
}, showExtra ? [a, b, c] : [a, b]);

// ✅ Good: Handle condition inside effect
useSafeEffect(() => {
  if (showExtra) {
    // use c
  }
}, [a, b, c, showExtra]);
```

#### "Potentially unstable dependencies"

```tsx
// ❌ Bad: New object on every render
useSafeEffect(() => {
  fetch('/api', options);
}, [{ method: 'POST' }]); // ← recreated each render!

// ✅ Good: Memoize or extract
const options = useMemo(() => ({ method: 'POST' }), []);
useSafeEffect(() => {
  fetch('/api', options);
}, [options]);
```

#### "Attempted to update state after unmount"

```tsx
// ❌ Bad: No unmount check
useEffect(() => {
  fetchData().then(setData); // May run after unmount!
}, []);

// ✅ Good: Check mounted state
const isMounted = useIsMounted();
useSafeEffect(() => {
  fetchData().then((data) => {
    if (isMounted()) setData(data);
  });
}, [isMounted]);
```

#### "Context value is undefined"

```tsx
// ❌ Bad: Using context outside provider
function MyComponent() {
  const theme = useSafeContext(ThemeContext); // ⚠️ Warning!
  return <div style={{ color: theme?.primary }}>Hello</div>;
}

// ✅ Good: Wrap with provider
function App() {
  return (
    <ThemeProvider>
      <MyComponent />
    </ThemeProvider>
  );
}
```

---

## Production Safety

This library is designed to have **zero runtime cost in production**:

```tsx
// In development:
// - All checks run
// - Warnings are displayed
// - Full debugging context

// In production (NODE_ENV === "production"):
// - All checks are stripped
// - Hooks behave identically to native hooks
// - No performance overhead
```

The `__DEV__` guard allows bundlers to tree-shake all development code:

```javascript
// This entire block is removed in production
if (__DEV__) {
  // validation logic
}
```

---

## Comparison with Native Hooks

| Feature | Native | react-safe-hooks |
|---------|--------|------------------|
| Functionality | ✅ | ✅ Identical |
| Type safety | ✅ | ✅ Same types |
| Dev warnings | ❌ | ✅ Comprehensive |
| Prod performance | ✅ Optimal | ✅ Identical |
| Bundle size impact | - | ~0 in prod |

---

## FAQ

### Does this affect production performance?

No. All development checks use `process.env.NODE_ENV !== "production"` guards, which bundlers like webpack, Rollup, and esbuild eliminate entirely during production builds.

### Is this SSR compatible?

Yes. The hooks work identically in SSR environments. `useSafeLayoutEffect` automatically falls back to `useEffect` on the server to avoid warnings.

### Should I use these everywhere or just for debugging?

You can safely use these as drop-in replacements for the native hooks. In production, they're identical to the native versions. In development, you get extra safety checks.

### How does stale closure detection work?

The library uses heuristics to detect when dependencies change but the callback reference doesn't update. This isn't foolproof but catches common patterns.

### Can I disable specific warnings?

Yes, use the options parameter:

```tsx
useSafeEffect(
  () => { /* ... */ },
  [],
  { warnOnMissingDeps: false }
);
```

### Does this replace the ESLint rules?

No, use both! ESLint catches issues statically at build time, while react-safe-hooks catches runtime patterns that static analysis can't detect.

---

## Requirements

- React 18.0.0 or higher
- TypeScript 4.7+ (optional but recommended)

## License

MIT © 2024

---

<p align="center">
  Made with ❤️ for React developers who want safer hooks
</p>

