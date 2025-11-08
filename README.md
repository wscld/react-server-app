# react-server-app

> A React-based server framework where API routes are defined using JSX, similar to how react-pdf and react-email use JSX for non-UI rendering.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?logo=fastify&logoColor=white)](https://www.fastify.io/)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)

## ✨ Features

- 🎯 **JSX as Configuration** - Define routes declaratively with familiar React syntax
- 🔒 **TypeScript-First** - Full type safety with generic type parameters
- ⚡ **Fastify Powered** - Fast, lightweight HTTP server under the hood
- 🎨 **Nested Routes** - Support for route prefixes via `<Controller>`
- � **Page Rendering** - SSR and SPA support with automatic bundling
- ⚛️ **Full React SPA** - Build interactive pages with hooks, state, and effects
- �🔄 **Bun & Node Compatible** - Works with both runtimes

## 📦 Installation

```bash
# Basic installation
bun add react-server-app react react-dom
# or
npm install react-server-app react react-dom
```

**For SPA mode (optional):**

If you want to use the `<Page>` component with `spa={true}` for client-side React apps, you'll also need to install Vite:

```bash
bun add vite @vitejs/plugin-react
# or
npm install vite @vitejs/plugin-react
```

## Quick Start

```tsx
import React from "react";
import { App, Controller, Route, createServer } from "react-server-app";

const server = (
  <App port={8080}>
    <Controller path="/api">
      <Route path="/users/:id" method="GET" onRequest={({ params }) => ({ id: params.id })} />
    </Controller>
  </App>
);

createServer(server);
```

## Components

### `<App>`

Root component that starts a Fastify server.

**Props:**

- `port?: number` - Port to listen on (default: 3000)
- `host?: string` - Host to bind to (default: '0.0.0.0')
- `children: ReactNode` - Child routes and controllers

### `<Controller>`

Groups routes under a common path prefix.

**Props:**

- `path: string` - Base path for all child routes
- `children: ReactNode` - Child routes or nested controllers

### `<Route>`

Defines a single API endpoint.

**Props:**

- `path: string` - Route path (supports Fastify path parameters like `:id`)
- `method: HTTPMethod | HTTPMethod[]` - HTTP method(s): GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
- `onRequest: RouteHandler` - Request handler function
- `schema?: object` - Optional Fastify schema for validation

**RouteHandler signature:**

```typescript
(context: { request: FastifyRequest; reply: FastifyReply; params: TParams; query: TQuery; body: TBody }) => TResponse | Promise<TResponse>;
```

### `<Page>`

Renders a full HTML page with optional SPA (Single Page Application) support. When `spa={true}` is enabled, the framework automatically bundles your React component and delivers it as a client-side application with full interactivity.

**Props:**

- `title?: string` - Page title (default: "React App")
- `meta?: Array<object>` - Meta tags for SEO and social sharing
- `links?: Array<object>` - Link tags for stylesheets, fonts, etc.
- `scripts?: Array<object>` - External scripts to include
- `styles?: string` - Inline CSS styles
- `lang?: string` - HTML lang attribute (default: "en")
- `doctype?: string` - Document type declaration
- `htmlAttributes?: object` - Additional attributes for `<html>` tag
- `bodyAttributes?: object` - Additional attributes for `<body>` tag
- `rootId?: string` - ID for the root div (default: "root")
- `spa?: boolean` - Enable SPA mode with automatic bundling (default: false)
- `status?: number` - HTTP status code (default: 200)
- `headers?: object` - Custom HTTP headers
- `children?: ReactNode` - Page content (React component for SPA mode)

**Basic SSR Example:**

```tsx
<Route
  path="/about"
  method="GET"
  onRequest={() => (
    <Page title="About Us" status={200}>
      <div>
        <h1>About Our Company</h1>
        <p>Static server-rendered content</p>
      </div>
    </Page>
  )}
/>
```

**SPA Mode Example:**

```tsx
// pages/Dashboard.tsx
export default function Dashboard({ userName }: { userName: string }) {
  const [count, setCount] = React.useState(0);

  return (
    <div>
      <h1>Welcome, {userName}!</h1>
      <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>
    </div>
  );
}

// routes.tsx
import Dashboard from "./pages/Dashboard";

<Route
  path="/dashboard"
  method="GET"
  onRequest={({ query }) => (
    <Page spa={true} title="Dashboard">
      <Dashboard userName={query.name || "Guest"} />
    </Page>
  )}
/>;
```

**How SPA Mode Works:**

1. **Automatic Bundling** - The framework detects your component, bundles it with Vite (or Bun), and caches the result
2. **Props Hydration** - Component props are serialized to a separate hashed JS file (`/__props/:hash.js`)
3. **Client-Side Mounting** - The bundled component mounts on the client using `ReactDOM.createRoot()`
4. **Full Interactivity** - `useState`, `useEffect`, event handlers, and all React features work as expected
5. **Smart Caching** - Bundles and props are cached with MD5 hashes and served with immutable cache headers

> **Note:** SPA mode requires `vite` and `@vitejs/plugin-react` to be installed. When using Node.js, the framework automatically falls back to Vite. With Bun runtime, you can use either Bun's built-in bundler or Vite.

**Configure Bundler:**

```tsx
import { configure } from "react-server-app";

// Set bundler preference (vite or bun)
configure({
  bundler: "vite", // or "bun" (requires Bun runtime)
  minify: true,
  cache: true,
});
```

## TypeScript Support

The library provides full TypeScript support with generic type parameters:

```typescript
interface UserParams {
  id: string;
}

interface User {
  id: string;
  name: string;
}

<Route<UserParams, never, never, { user: User }>
  path="/users/:id"
  method="GET"
  onRequest={({ params }) => {
    // params.id is typed as string
    return { user: { id: params.id, name: "John" } };
  }}
/>;
```

## Features

- ✅ TypeScript-first with inferred types
- ✅ Fastify under the hood for performance
- ✅ Declarative route definition with JSX
- ✅ Support for nested path prefixes via `<Controller>`
- ✅ Server-side rendering (SSR) with `<Page>` component
- ✅ Single Page Application (SPA) mode with automatic bundling
- ✅ React hooks support (useState, useEffect, etc.) in SPA mode
- ✅ Automatic component detection and bundling (Vite/Bun)
- ✅ Smart caching with MD5-hashed bundles
- ✅ Works with Bun (default) and Node.js
- ✅ No react-reconciler—just simple element traversal

## Roadmap

- [ ] Schema validation with Zod/TypeBox integration
- [ ] WebSocket support via `<WebSocket>` component
- [ ] Plugin system for extending functionality
- [ ] Hot reload in development mode
- [ ] React reconciler for advanced use cases
- [ ] CLI tool for scaffolding projects

## Follow Me

Follow me on X (Twitter) [@wescld](https://x.com/wescld) for updates and more projects!

Built with ❤️ using React, Fastify, and Bun.
