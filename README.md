# react-server-app

> A React-based server framework where you define routes using JSX components, combining the power of React with Fastify's performance.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-000000?logo=fastify&logoColor=white)](https://www.fastify.io/)
[![Bun](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)](https://bun.sh/)
[![npm version](https://img.shields.io/npm/v/react-server-app.svg)](https://www.npmjs.com/package/react-server-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🎯 **JSX as Configuration** - Define routes declaratively with React components
- 🛡️ **Guards & Middleware** - Built-in support for authentication and request processing
- 🔒 **TypeScript-First** - Full type safety with generic type parameters
- ⚡ **Fastify Powered** - Blazing fast HTTP server under the hood
- 🎨 **Nested Routes** - Organize routes with `<Controller>` components
- 📄 **Page Rendering** - SSR and SPA support with automatic bundling
- ⚛️ **Full React SPA** - Build interactive pages with hooks, state, and effects  
- 🔄 **Hot Reload** - Development mode with automatic cache invalidation
- 🎭 **"use spa" Directive** - Auto-discovery of SPA components at startup
- 🚀 **Bun & Node Compatible** - Works with both runtimes seamlessly

## 📦 Installation

```bash
# Using Bun (recommended)
bun add react-server-app react react-dom

# Using npm
npm install react-server-app react react-dom

# For SPA mode, also install:
bun add vite @vitejs/plugin-react
# or
npm install vite @vitejs/plugin-react
```

## 🚀 Quick Start

```tsx
import React from "react";
import { App, Route, createServer } from "react-server-app";

const server = (
  <App port={3000}>
    <Route 
      path="/hello" 
      method="GET" 
      onRequest={() => ({ message: "Hello World!" })} 
    />
  </App>
);

createServer(server);
```

Run with:
```bash
bun run server.tsx
# or
tsx server.tsx
```

Visit http://localhost:3000/hello

📚 **[See Full Quick Start Guide](./quick-start/README.md)**

## 📖 Documentation

- [Quick Start Guide](./quick-start/README.md) - Get started in 5 minutes
- [API Components](./quick-start/01-COMPONENTS.md) - All available components
- [Guards & Middleware](./quick-start/02-GUARDS-MIDDLEWARE.md) - Authentication and request processing
- [SPA Pages](./quick-start/03-SPA-PAGES.md) - Build interactive pages
- [Configuration](./quick-start/04-CONFIGURATION.md) - Framework configuration options
- ["use spa" Directive](./docs/USE_SPA_DIRECTIVE.md) - Auto-discovery of SPA components

## 💡 Examples

### Simple API Route

```tsx
<Route 
  path="/users/:id" 
  method="GET" 
  onRequest={({ params }) => ({ 
    userId: params.id,
    name: "John Doe"
  })} 
/>
```

### Nested Controllers

```tsx
<Controller path="/api">
  <Controller path="/users">
    <Route path="/" method="GET" onRequest={() => getAllUsers()} />
    <Route path="/:id" method="GET" onRequest={({ params }) => getUser(params.id)} />
    <Route path="/" method="POST" onRequest={({ body }) => createUser(body)} />
  </Controller>
</Controller>
```

### Protected Routes with Guards

```tsx
<Guard use={authGuard}>
  <Route path="/dashboard" method="GET" onRequest={getDashboard} />
  <Route path="/profile" method="GET" onRequest={getProfile} />
</Guard>
```

### SPA Page with React Hooks

```tsx
// dashboard.tsx
"use spa";

import { useState } from "react";

export default function Dashboard() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

// server.tsx
<Route
  path="/dashboard"
  method="GET"
  onRequest={() => (
    <Page spa={true} title="Dashboard">
      <Dashboard />
    </Page>
  )}
/>
```

## 🎯 Core Concepts

### Components

- **`<App>`** - Root component that starts the server
- **`<Controller>`** - Groups routes under a common path
- **`<Route>`** - Defines HTTP endpoints
- **`<Guard>`** - Protects routes with authorization logic
- **`<Middleware>`** - Processes requests before handlers
- **`<Page>`** - Renders HTML pages (SSR or SPA)
- **`<Response>`** - Declarative response formatting

### TypeScript Support

Full type safety with generic type parameters:

```tsx
interface UserParams {
  id: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

<Route<UserParams, never, never, User>
  path="/users/:id"
  method="GET"
  onRequest={({ params }) => {
    // params.id is typed as string
    return {
      id: params.id,
      name: "John Doe",
      email: "john@example.com"
    };
  }}
/>
```

## 🔧 Configuration

Configure the framework to your needs:

```tsx
import { configure } from "react-server-app";

configure({
  bundler: 'vite',        // or 'bun'
  minify: true,           // Minify bundles
  cache: true,            // Enable caching
  spaComponentDirs: [     // Directories to scan for "use spa"
    'pages',
    'components'
  ],
  spaComponentExclude: [  // Directories to exclude
    'node_modules',
    'dist'
  ]
});
```

📖 **[Full Configuration Guide](./quick-start/04-CONFIGURATION.md)**

## 🚀 Advanced Features

### Hot Reload

Development mode automatically watches your files and clears the cache when changes are detected. **No server restart needed!**

```tsx
// Just save your file and changes are reflected immediately
```

### "use spa" Directive

Auto-discover SPA components at startup:

```tsx
// pages/Dashboard.tsx
"use spa";

export default function Dashboard() {
  return <div>Auto-discovered!</div>;
}
```

No registration needed - the framework finds it automatically.

📖 **[Read the full guide](./docs/USE_SPA_DIRECTIVE.md)**

### Modular Bundler System

Supports multiple bundlers with a clean plugin architecture:

- **Bun Bundler** - Native Bun bundling (very fast)
- **Vite Bundler** - Industry-standard bundler (Node.js compatible)

Add your own bundler by implementing the `Bundler` interface!

## 📚 Complete Example

Check out the [demo application](./examples/demo) for a complete working example with:

- Authentication guards
- CORS middleware
- API routes
- Interactive SPA pages
- TypeScript types
- "use spa" directive usage

## 🗺️ Roadmap

- [x] ~~Hot reload in development mode~~
- [x] ~~Guards and Middleware support~~
- [x] ~~"use spa" directive for auto-discovery~~
- [x] ~~Modular bundler architecture~~
- [ ] Schema validation with Zod/TypeBox integration
- [ ] WebSocket support via `<WebSocket>` component
- [ ] Plugin system for extending functionality
- [ ] CLI tool for scaffolding projects
- [ ] React reconciler for advanced use cases

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT

## 👤 Author

**Wesley Caldas**

- X (Twitter): [@wescld](https://x.com/wescld)
- GitHub: [@wesleycaldas](https://github.com/wesleycaldas)

## 🔗 Links

- **npm**: [react-server-app](https://www.npmjs.com/package/react-server-app)
- **Documentation**: [Quick Start Guide](./quick-start/README.md)

---

**Built with ❤️ using React, Fastify, and TypeScript**
