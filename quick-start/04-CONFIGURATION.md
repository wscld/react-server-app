# Configuration Guide

Learn how to configure **react-server-app** for your specific needs.

## Table of Contents

- [Configuration Overview](#configuration-overview)
- [Server Configuration](#server-configuration)
- [Bundler Configuration](#bundler-configuration)
- [SPA Component Discovery](#spa-component-discovery)
- [Caching](#caching)
- [Environment-Specific Config](#environment-specific-config)
- [TypeScript Configuration](#typescript-configuration)
- [Examples](#examples)

---

## Configuration Overview

Configure the framework using the `configure()` function:

```tsx
import { configure } from "react-server-app";

configure({
  // Server options
  port: 3000,
  host: 'localhost',
  
  // Bundler options
  bundler: 'vite',
  minify: true,
  cache: true,
  
  // SPA component discovery
  spaComponentDirs: ['pages', 'components'],
  spaComponentExclude: ['node_modules', 'dist'],
});
```

---

## Server Configuration

### Port and Host

```tsx
import { App, createServer } from "react-server-app";

const server = (
  <App port={8080} host="0.0.0.0">
    {/* Routes */}
  </App>
);

createServer(server);
```

**Options:**

- `port` (number): Port to listen on. Default: `3000`
- `host` (string): Host to bind to. Default: `'0.0.0.0'`

### Environment Variables

```tsx
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = (
  <App port={PORT} host={HOST}>
    {/* Routes */}
  </App>
);
```

---

## Bundler Configuration

### Selecting a Bundler

```tsx
import { configure } from "react-server-app";

configure({
  bundler: 'vite', // or 'bun'
});
```

**Options:**

- `'bun'`: Use Bun's native bundler (requires Bun runtime, very fast)
- `'vite'`: Use Vite bundler (works with Node.js and Bun, requires `vite` and `@vitejs/plugin-react`)

**Auto-Detection:**

If not specified, the framework auto-detects:
- **Bun runtime**: Uses Bun bundler by default
- **Node.js runtime**: Uses Vite bundler (must be installed)

### Minification

```tsx
configure({
  minify: true, // Enable code minification
});
```

**When to use:**

- ✅ Production: Always enable for smaller bundle sizes
- ❌ Development: Disable for faster builds and easier debugging

### Caching

```tsx
configure({
  cache: true, // Enable bundle caching
});
```

**How it works:**

1. Bundles are hashed with MD5
2. Cached in memory by hash
3. Served with cache-control headers

**Cache Control Headers:**

Development mode:
```
Cache-Control: no-cache, no-store, must-revalidate
```

Production mode:
```
Cache-Control: public, max-age=31536000, immutable
```

---

## SPA Component Discovery

Configure auto-discovery of components with the `"use spa"` directive.

### Basic Configuration

```tsx
configure({
  spaComponentDirs: ['pages', 'components', 'app'],
  spaComponentExclude: ['node_modules', 'dist', 'build'],
});
```

### Options

#### `spaComponentDirs`

Array of directories to scan for `"use spa"` components.

```tsx
configure({
  spaComponentDirs: [
    'src/pages',
    'src/components',
    'app/dashboard',
  ],
});
```

**Default:**
```tsx
['src', 'app', 'pages', 'components']
```

#### `spaComponentExclude`

Array of directories to exclude from scanning.

```tsx
configure({
  spaComponentExclude: [
    'node_modules',
    'dist',
    'build',
    '.next',
    '.git',
    'tests',
  ],
});
```

**Default:**
```tsx
['node_modules', 'dist', 'build', '.next', '.git']
```

### Example Structure

```
project/
├── pages/           ✅ Scanned
│   ├── Home.tsx
│   └── About.tsx
├── components/      ✅ Scanned
│   └── Header.tsx
├── node_modules/    ❌ Excluded
└── dist/            ❌ Excluded
```

**How it works:**

1. At server startup, framework scans `spaComponentDirs`
2. Reads each `.tsx`/`.jsx` file
3. Checks for `"use spa";` directive at the top
4. Extracts component name from `export default`
5. Builds registry mapping component names to file paths

📚 **[Full "use spa" directive guide](../docs/USE_SPA_DIRECTIVE.md)**

---

## Caching

### Bundle Cache

Bundles are cached in memory:

```typescript
const bundleCache = new Map<string, { code: string; hash: string }>();
```

**Cache Key**: MD5 hash of component file path + props

**Cache Clearing:**

Development mode automatically clears cache when files change (hot reload).

### Manual Cache Clearing

```tsx
import { clearBundleCache } from "react-server-app";

// Clear cache for a specific component
clearBundleCache('./pages/Dashboard.tsx');

// Or clear all caches (useful for testing)
clearBundleCache();
```

---

## Environment-Specific Config

### Development

```tsx
import { configure } from "react-server-app";

const isDev = process.env.NODE_ENV !== 'production';

configure({
  bundler: 'vite',
  minify: !isDev,          // No minification in dev
  cache: true,             // Cache in all environments
});

const server = (
  <App port={isDev ? 3000 : 8080}>
    {/* Routes */}
  </App>
);
```

### Production

```tsx
// production.config.ts
import { configure } from "react-server-app";

configure({
  bundler: 'bun',           // Use Bun for speed
  minify: true,             // Minify for smaller bundles
  cache: true,              // Cache everything
  spaComponentDirs: ['dist/pages', 'dist/components'],
});
```

### Using `.env` Files

```bash
# .env.development
NODE_ENV=development
PORT=3000
HOST=localhost
BUNDLER=vite
MINIFY=false

# .env.production
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
BUNDLER=bun
MINIFY=true
```

```tsx
import { configure } from "react-server-app";

configure({
  bundler: (process.env.BUNDLER as 'vite' | 'bun') || 'vite',
  minify: process.env.MINIFY === 'true',
});
```

---

## TypeScript Configuration

### tsconfig.json

Recommended TypeScript configuration:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./",
    "types": ["node"]
  },
  "include": ["src/**/*", "pages/**/*", "server.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

### Key Settings

- `"jsx": "react-jsx"`: Use React 17+ JSX transform
- `"module": "NodeNext"`: Enable ES modules
- `"moduleResolution": "NodeNext"`: Resolve imports correctly
- `"esModuleInterop": true`: Compatibility with CommonJS

### package.json

```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx server.tsx",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

---

## Examples

### Complete Development Config

```tsx
// server.dev.tsx
import React from "react";
import { App, Controller, Route, configure, createServer } from "react-server-app";

// Development configuration
configure({
  bundler: 'vite',
  minify: false,
  cache: true,
  spaComponentDirs: ['pages', 'components'],
  spaComponentExclude: ['node_modules', 'dist', 'tests'],
});

const server = (
  <App port={3000} host="localhost">
    <Controller path="/api">
      <Route path="/health" method="GET" onRequest={() => ({ status: "ok" })} />
    </Controller>
  </App>
);

createServer(server);
console.log("Development server running on http://localhost:3000");
```

### Complete Production Config

```tsx
// server.prod.tsx
import React from "react";
import { App, Controller, Route, configure, createServer } from "react-server-app";

// Production configuration
configure({
  bundler: 'bun',
  minify: true,
  cache: true,
  spaComponentDirs: ['dist/pages', 'dist/components'],
  spaComponentExclude: ['node_modules'],
});

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = (
  <App port={PORT} host={HOST}>
    <Controller path="/api">
      <Route path="/health" method="GET" onRequest={() => ({ status: "ok" })} />
    </Controller>
  </App>
);

createServer(server);
console.log(`Production server running on http://${HOST}:${PORT}`);
```

### Environment-Based Config

```tsx
// config.ts
import { configure } from "react-server-app";

const isDevelopment = process.env.NODE_ENV !== 'production';

export const appConfig = {
  port: parseInt(process.env.PORT || (isDevelopment ? '3000' : '8080'), 10),
  host: process.env.HOST || (isDevelopment ? 'localhost' : '0.0.0.0'),
};

configure({
  bundler: process.env.BUNDLER as 'vite' | 'bun' || 'vite',
  minify: !isDevelopment,
  cache: true,
  spaComponentDirs: isDevelopment 
    ? ['pages', 'components']
    : ['dist/pages', 'dist/components'],
  spaComponentExclude: ['node_modules', 'dist', 'build', 'tests'],
});

// server.tsx
import { appConfig } from './config';

const server = (
  <App port={appConfig.port} host={appConfig.host}>
    {/* Routes */}
  </App>
);
```

### Multi-Environment Setup

```typescript
// config/base.ts
export const baseConfig = {
  spaComponentExclude: ['node_modules', 'dist', 'build'],
  cache: true,
};

// config/development.ts
import { baseConfig } from './base';

export const devConfig = {
  ...baseConfig,
  bundler: 'vite' as const,
  minify: false,
  spaComponentDirs: ['src/pages', 'src/components'],
  port: 3000,
  host: 'localhost',
};

// config/production.ts
import { baseConfig } from './base';

export const prodConfig = {
  ...baseConfig,
  bundler: 'bun' as const,
  minify: true,
  spaComponentDirs: ['dist/pages', 'dist/components'],
  port: 8080,
  host: '0.0.0.0',
};

// server.ts
import { configure } from "react-server-app";
import { devConfig } from './config/development';
import { prodConfig } from './config/production';

const isDev = process.env.NODE_ENV !== 'production';
const config = isDev ? devConfig : prodConfig;

configure(config);

const server = (
  <App port={config.port} host={config.host}>
    {/* Routes */}
  </App>
);
```

---

## Configuration Reference

### Complete Type Definition

```typescript
interface Config {
  // Server
  port?: number;
  host?: string;
  
  // Bundler
  bundler?: 'vite' | 'bun';
  minify?: boolean;
  cache?: boolean;
  
  // SPA Discovery
  spaComponentDirs?: string[];
  spaComponentExclude?: string[];
}
```

### Default Values

```typescript
{
  port: 3000,
  host: '0.0.0.0',
  bundler: 'vite', // or 'bun' if Bun runtime detected
  minify: false,
  cache: true,
  spaComponentDirs: ['src', 'app', 'pages', 'components'],
  spaComponentExclude: ['node_modules', 'dist', 'build', '.next', '.git'],
}
```

---

## Next Steps

- Learn about [SPA Pages](./03-SPA-PAGES.md)
- Explore [Guards & Middleware](./02-GUARDS-MIDDLEWARE.md)
- Read ["use spa" directive guide](../docs/USE_SPA_DIRECTIVE.md)
- Check out the [demo application](../examples/demo)
