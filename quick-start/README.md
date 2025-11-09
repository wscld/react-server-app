# Quick Start Guide

Welcome to **react-server-app**! This guide will help you get started in just a few minutes.

## 📚 Learning Path

Follow these guides in order to master the framework:

1. **[Components Reference](./01-COMPONENTS.md)** - Learn all available components
2. **[Guards & Middleware](./02-GUARDS-MIDDLEWARE.md)** - Add authentication and request processing
3. **[SPA Pages](./03-SPA-PAGES.md)** - Build interactive React pages
4. **[Configuration](./04-CONFIGURATION.md)** - Configure the framework
5. **["use spa" Directive](../docs/USE_SPA_DIRECTIVE.md)** - Auto-discovery of SPA components

## ⚡ 5-Minute Quick Start

### 1. Install

```bash
# Using Bun (recommended)
bun add react-server-app react

# Using npm
npm install react-server-app react
```

### 2. Create a Server

Create `server.tsx`:

```tsx
import React from "react";
import { App, Route, createServer } from "react-server-app";

const server = (
  <App port={3000}>
    <Route path="/hello" method="GET" onRequest={() => ({ message: "Hello World!" })} />
  </App>
);

createServer(server);
```

### 3. Run It

```bash
# Using Bun
bun run server.tsx

# Using Node.js with tsx
npx tsx server.tsx
```

### 4. Test It

```bash
curl http://localhost:3000/hello
# {"message":"Hello World!"}
```

## 🎯 What's Next?

### Build a Real API

```tsx
import React from "react";
import { App, Controller, Route, createServer } from "react-server-app";

const users = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
];

const server = (
  <App port={3000}>
    <Controller path="/api">
      <Controller path="/users">
        <Route path="/" method="GET" onRequest={() => users} />
        <Route
          path="/:id"
          method="GET"
          onRequest={({ params }) => {
            const user = users.find((u) => u.id === params.id);
            if (!user) {
              return { error: "User not found", status: 404 };
            }
            return user;
          }}
        />
      </Controller>
    </Controller>
  </App>
);

createServer(server);
```

### Add Authentication

```tsx
import { Guard } from "react-server-app";

const authGuard = ({ request }) => {
  const token = request.headers.authorization?.replace("Bearer ", "");

  if (!token || token !== "secret-token") {
    return {
      authorized: false,
      status: 401,
      message: "Unauthorized",
    };
  }

  return { authorized: true, user: { id: "1", name: "Alice" } };
};

const server = (
  <App port={3000}>
    <Guard use={authGuard}>
      <Route
        path="/protected"
        method="GET"
        onRequest={(ctx) => ({
          message: "Secret data",
          user: ctx.user, // From guard context
        })}
      />
    </Guard>
  </App>
);
```

### Create an Interactive Page

```tsx
// pages/Counter.tsx
"use spa";

import { useState } from "react";

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}

// server.tsx
import { Page } from "react-server-app";
import Counter from "./pages/Counter";

<Route
  path="/counter"
  method="GET"
  onRequest={() => (
    <Page spa={true} title="Counter App">
      <Counter />
    </Page>
  )}
/>;
```

## 🛠️ Development Tips

### Hot Reload

The framework automatically watches your files in development mode and clears the cache when changes are detected. No need to restart the server!

### TypeScript Support

Get full type safety:

```tsx
interface UserParams {
  id: string;
}

interface User {
  id: string;
  name: string;
}

<Route<UserParams, never, never, User>
  path="/users/:id"
  method="GET"
  onRequest={({ params }) => {
    // params.id is typed as string
    const user = users.find((u) => u.id === params.id);
    return user!; // Return type is User
  }}
/>;
```

### Use "use spa" Directive

Add `"use spa";` at the top of your component files to enable auto-discovery. No need to register components manually!

```tsx
// pages/Dashboard.tsx
"use spa";

export default function Dashboard() {
  return <div>Dashboard Content</div>;
}
```

The framework will automatically find and bundle this component at startup.

## 📖 Next Steps

- Read the [Components Reference](./01-COMPONENTS.md) to learn all available components
- Learn about [Guards & Middleware](./02-GUARDS-MIDDLEWARE.md) for advanced request handling
- Build interactive UIs with [SPA Pages](./03-SPA-PAGES.md)
- Explore the [full example application](../examples/demo) for a complete reference

## 💬 Need Help?

- Check the [examples](../examples) folder
- Read the [API documentation](./01-COMPONENTS.md)
- Look at the [demo application](../examples/demo) for real-world usage

Happy coding! 🚀
