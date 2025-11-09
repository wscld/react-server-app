# SPA Pages Guide

Build fully interactive Single Page Applications (SPAs) with React using **react-server-app**.

## Table of Contents

- [What is SPA Mode?](#what-is-spa-mode)
- [When to Use SPA Mode](#when-to-use-spa-mode)
- [Basic SPA Setup](#basic-spa-setup)
- [Using "use spa" Directive](#using-use-spa-directive)
- [Component Props](#component-props)
- [React Hooks](#react-hooks)
- [Styling](#styling)
- [Bundling](#bundling)
- [Best Practices](#best-practices)
- [Examples](#examples)

---

## What is SPA Mode?

SPA mode transforms your React components into fully interactive client-side applications.

### SSR Mode (Default)

Server renders HTML only - **no client-side React**:

```tsx
<Route
  path="/about"
  method="GET"
  onRequest={() => (
    <Page title="About">
      <div>Static HTML content</div>
    </Page>
  )}
/>
```

Result: Static HTML with no interactivity.

### SPA Mode

Full React app with hooks, state, effects, and event handlers:

```tsx
<Route
  path="/counter"
  method="GET"
  onRequest={() => (
    <Page spa={true} title="Counter">
      <Counter />
    </Page>
  )}
/>
```

Result: Interactive React application running in the browser.

---

## When to Use SPA Mode

### Use SPA Mode For:

✅ Interactive forms with validation  
✅ Real-time data updates  
✅ Client-side routing (single-page feel)  
✅ Complex UI state management  
✅ Data visualization (charts, graphs)  
✅ Dashboards and admin panels

### Use SSR Mode For:

✅ Static content pages  
✅ Documentation  
✅ Blog posts  
✅ Landing pages  
✅ SEO-critical pages

---

## Basic SPA Setup

### 1. Install Dependencies

SPA mode requires bundler dependencies:

```bash
# For Node.js (Vite bundler)
npm install vite @vitejs/plugin-react

# For Bun (can use built-in bundler or Vite)
bun add vite @vitejs/plugin-react
```

### 2. Create a Component

```tsx
// pages/Counter.tsx
import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}
```

### 3. Create a Route

```tsx
// server.tsx
import { App, Route, Page, createServer } from "react-server-app";
import Counter from "./pages/Counter";

const server = (
  <App port={3000}>
    <Route
      path="/counter"
      method="GET"
      onRequest={() => (
        <Page spa={true} title="Counter App">
          <Counter />
        </Page>
      )}
    />
  </App>
);

createServer(server);
```

### 4. Run It

```bash
bun run server.tsx
# or
npx tsx server.tsx
```

Visit http://localhost:3000/counter

---

## Using "use spa" Directive

Add `"use spa";` at the top of component files to enable **auto-discovery**. The framework will automatically find and bundle these components at startup.

### Without "use spa" (Manual)

```tsx
// pages/Dashboard.tsx
import { useState } from "react";

export default function Dashboard() {
  return <div>Dashboard</div>;
}

// server.tsx
import { registerComponent } from "react-server-app";
import Dashboard from "./pages/Dashboard";

// Must register manually
registerComponent(Dashboard, "./pages/Dashboard.tsx");
```

### With "use spa" (Auto-discovery)

```tsx
// pages/Dashboard.tsx
"use spa";

import { useState } from "react";

export default function Dashboard() {
  return <div>Dashboard</div>;
}

// server.tsx
// No registration needed! Framework finds it automatically.
```

### Configure Discovery

```tsx
import { configure } from "react-server-app";

configure({
  spaComponentDirs: ["pages", "components", "app"],
  spaComponentExclude: ["node_modules", "dist", "build"],
});
```

📚 **[Read full "use spa" directive guide](../docs/USE_SPA_DIRECTIVE.md)**

---

## Component Props

Pass data from server to your SPA components.

### Server-Side

```tsx
<Route
  path="/user/:id"
  method="GET"
  onRequest={async ({ params }) => {
    const user = await getUserById(params.id);

    return (
      <Page spa={true} title={`User: ${user.name}`}>
        <UserProfile user={user} />
      </Page>
    );
  }}
/>
```

### Client-Side

```tsx
"use spa";

interface User {
  id: string;
  name: string;
  email: string;
}

export default function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

**Props are serialized to JSON and hydrated on the client automatically.**

---

## React Hooks

All React hooks work in SPA mode!

### useState

```tsx
"use spa";

import { useState } from "react";

export default function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const addTodo = () => {
    setTodos([...todos, input]);
    setInput("");
  };

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="New todo" />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((todo, i) => (
          <li key={i}>{todo}</li>
        ))}
      </ul>
    </div>
  );
}
```

### useEffect

```tsx
"use spa";

import { useState, useEffect } from "react";

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return <div>Current time: {time.toLocaleTimeString()}</div>;
}
```

### useRef

```tsx
"use spa";

import { useRef } from "react";

export default function FocusInput() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input ref={inputRef} />
      <button onClick={() => inputRef.current?.focus()}>Focus Input</button>
    </div>
  );
}
```

### Custom Hooks

```tsx
"use spa";

import { useState, useEffect } from "react";

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, [url]);

  return { data, loading };
}

export default function UserList() {
  const { data, loading } = useFetch<{ users: any[] }>("/api/users");

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {data?.users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

---

## Styling

### Inline Styles

```tsx
"use spa";

export default function StyledComponent() {
  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: "#f0f0f0",
        borderRadius: "8px",
      }}
    >
      Styled content
    </div>
  );
}
```

### CSS in Page

```tsx
<Page
  spa={true}
  title="Styled App"
  styles={`
    body { 
      font-family: Arial, sans-serif; 
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
  `}
>
  <MyComponent />
</Page>
```

### External Stylesheet

```tsx
<Page spa={true} title="Styled App" links={[{ rel: "stylesheet", href: "/styles.css" }]}>
  <MyComponent />
</Page>
```

### CSS Modules (with Vite)

```tsx
// Component.module.css
.container {
  padding: 20px;
  background: #f0f0f0;
}

// Component.tsx
"use spa";

import styles from './Component.module.css';

export default function Component() {
  return <div className={styles.container}>Styled</div>;
}
```

---

## Bundling

### Bundler Selection

The framework supports two bundlers:

1. **Bun Bundler** (default with Bun runtime) - Fast, native
2. **Vite Bundler** (Node.js or Bun) - Widely compatible

```tsx
import { configure } from "react-server-app";

configure({
  bundler: "vite", // or 'bun'
  minify: true,
  cache: true,
});
```

### How Bundling Works

1. **Detection**: Framework detects component file path
2. **Entry Creation**: Creates temporary entry file with React mounting code
3. **Bundling**: Runs bundler (Vite or Bun) to create client bundle
4. **Hashing**: Generates MD5 hash of bundle for caching
5. **Serving**: Serves bundle at `/__bundles/:hash.js`
6. **Props**: Serializes props to `/__props/:hash.js`

### Cache Control

Development mode:

```
Cache-Control: no-cache, no-store, must-revalidate
```

Production mode:

```
Cache-Control: public, max-age=31536000, immutable
```

### Hot Reload

In development, the framework watches component files and clears the cache when changes are detected. **No server restart needed!**

---

## Best Practices

### 1. Use TypeScript

Get full type safety:

```tsx
"use spa";

interface Props {
  userId: string;
  initialCount: number;
}

export default function Component({ userId, initialCount }: Props) {
  // TypeScript knows the prop types
}
```

### 2. Keep Components Pure

Separate server and client logic:

```tsx
// ✅ Good - server fetches data, client receives props
<Route
  path="/users"
  method="GET"
  onRequest={async () => {
    const users = await fetchUsers(); // Server-side
    return (
      <Page spa={true}>
        <UserList users={users} />
      </Page>
    );
  }}
/>

// ❌ Bad - client trying to access server resources
"use spa";
export default function UserList() {
  const users = await fetchUsersFromDatabase(); // Won't work!
  return <div>{users.map(...)}</div>;
}
```

### 3. Use "use spa" Directive

Enable auto-discovery for cleaner code:

```tsx
// ✅ Good
"use spa";
export default function Dashboard() { ... }

// ❌ Bad - manual registration
import { registerComponent } from "react-server-app";
registerComponent(Dashboard, "./Dashboard.tsx");
```

### 4. Optimize Bundle Size

Only import what you need:

```tsx
// ✅ Good
import { useState } from "react";

// ❌ Bad
import * as React from "react";
```

### 5. Handle Loading States

```tsx
"use spa";

import { useState, useEffect } from "react";

export default function DataView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/data")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  return <div>{JSON.stringify(data)}</div>;
}
```

---

## Examples

### Interactive Dashboard

```tsx
// pages/Dashboard.tsx
"use spa";

import { useState, useEffect } from "react";

interface Stats {
  users: number;
  posts: number;
  revenue: number;
}

export default function Dashboard({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch("/api/stats");
      const newStats = await res.json();
      setStats(newStats);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        <div style={{ padding: "20px", background: "#f0f0f0", borderRadius: "8px" }}>
          <h2>Users</h2>
          <p style={{ fontSize: "2em" }}>{stats.users}</p>
        </div>
        <div style={{ padding: "20px", background: "#f0f0f0", borderRadius: "8px" }}>
          <h2>Posts</h2>
          <p style={{ fontSize: "2em" }}>{stats.posts}</p>
        </div>
        <div style={{ padding: "20px", background: "#f0f0f0", borderRadius: "8px" }}>
          <h2>Revenue</h2>
          <p style={{ fontSize: "2em" }}>${stats.revenue}</p>
        </div>
      </div>
    </div>
  );
}

// server.tsx
<Route
  path="/dashboard"
  method="GET"
  onRequest={async () => {
    const stats = await getStats();
    return (
      <Page spa={true} title="Dashboard">
        <Dashboard initialStats={stats} />
      </Page>
    );
  }}
/>;
```

### Form with Validation

```tsx
"use spa";

import { useState } from "react";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const validate = () => {
    const newErrors: string[] = [];

    if (!email.includes("@")) {
      newErrors.push("Invalid email");
    }

    if (password.length < 8) {
      newErrors.push("Password must be at least 8 characters");
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      alert("Signup successful!");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "50px auto" }}>
      <h1>Sign Up</h1>

      {errors.length > 0 && (
        <div style={{ color: "red", marginBottom: "10px" }}>
          {errors.map((error, i) => (
            <div key={i}>{error}</div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: "15px" }}>
        <label>Email:</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "8px" }} />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Password:</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "8px" }} />
      </div>

      <button type="submit" style={{ padding: "10px 20px" }}>
        Sign Up
      </button>
    </form>
  );
}
```

See the [demo application](../examples/demo) for more complete examples!
