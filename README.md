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
- 🔄 **Bun & Node Compatible** - Works with both runtimes

## 📦 Installation

```bash
bun add react-server-app react
# or
npm install react-server-app react
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
