# Components Reference

This guide covers all available components in **react-server-app**.

## Table of Contents

- [App](#app)
- [Controller](#controller)
- [Route](#route)
- [Guard](#guard)
- [Middleware](#middleware)
- [Page](#page)
- [Response](#response)

---

## App

The root component that creates and starts a Fastify server.

### Props

```typescript
interface AppProps {
  port?: number;          // Port to listen on (default: 3000)
  host?: string;          // Host to bind to (default: '0.0.0.0')
  children: ReactNode;    // Child routes, controllers, guards, middleware
}
```

### Example

```tsx
import { App, createServer } from "react-server-app";

const server = (
  <App port={8080} host="localhost">
    {/* Routes go here */}
  </App>
);

createServer(server);
```

### Notes

- Only one `<App>` component per server
- Must be the root element
- Call `createServer()` to start the server

---

## Controller

Groups routes under a common path prefix. Supports nesting for hierarchical route organization.

### Props

```typescript
interface ControllerProps {
  path: string;        // Base path for all child routes
  children: ReactNode; // Child routes or nested controllers
}
```

### Example

```tsx
<Controller path="/api">
  <Controller path="/users">
    <Route path="/" method="GET" onRequest={() => getAllUsers()} />
    <Route path="/:id" method="GET" onRequest={({ params }) => getUser(params.id)} />
  </Controller>
  
  <Controller path="/posts">
    <Route path="/" method="GET" onRequest={() => getAllPosts()} />
  </Controller>
</Controller>
```

This creates routes:
- `GET /api/users/`
- `GET /api/users/:id`
- `GET /api/posts/`

### Notes

- Controllers can be nested infinitely
- Paths are concatenated automatically
- Controllers inherit guards and middleware from parent scopes

---

## Route

Defines an HTTP endpoint.

### Props

```typescript
interface RouteProps<TParams = any, TQuery = any, TBody = any, TResponse = any> {
  path: string;                          // Route path (supports :param syntax)
  method: HTTPMethod | HTTPMethod[];     // HTTP method(s)
  onRequest: RouteHandler<TParams, TQuery, TBody, TResponse>;
  schema?: object;                       // Fastify validation schema (optional)
}

type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

type RouteHandler<TParams, TQuery, TBody, TResponse> = (context: {
  request: FastifyRequest;
  reply: FastifyReply;
  params: TParams;
  query: TQuery;
  body: TBody;
  [key: string]: any; // Additional context from guards/middleware
}) => TResponse | Promise<TResponse>;
```

### Examples

#### Basic Route

```tsx
<Route 
  path="/hello" 
  method="GET" 
  onRequest={() => ({ message: "Hello World!" })} 
/>
```

#### Route with Parameters

```tsx
<Route 
  path="/users/:id" 
  method="GET" 
  onRequest={({ params }) => ({ userId: params.id })} 
/>
```

#### Multiple Methods

```tsx
<Route 
  path="/resource" 
  method={["GET", "POST"]} 
  onRequest={({ request }) => {
    if (request.method === "GET") {
      return { action: "fetch" };
    }
    return { action: "create" };
  }} 
/>
```

#### With TypeScript

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

#### With Validation Schema

```tsx
<Route
  path="/users"
  method="POST"
  schema={{
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' }
      }
    }
  }}
  onRequest={({ body }) => {
    // body is validated before reaching here
    return { created: true, user: body };
  }}
/>
```

### Notes

- Paths support Fastify's path parameter syntax (`:param`, `:param?`, `:param*`)
- Return value is automatically sent as JSON
- Can return JSX (`<Page>` or `<Response>`) for HTML responses
- Async functions are fully supported

---

## Guard

Protects routes with authorization logic. Guards can authenticate, authorize, and add context to requests.

### Props

```typescript
interface GuardProps {
  use: GuardFunction | GuardFunction[]; // Guard function(s)
  children: ReactNode;                   // Protected routes
}

type GuardFunction = (context: {
  request: FastifyRequest;
  reply: FastifyReply;
  params: any;
  query: any;
  body: any;
}) => GuardResult | Promise<GuardResult>;

interface GuardResult {
  authorized: boolean;     // Whether access is granted
  status?: number;         // HTTP status if not authorized (default: 403)
  message?: string;        // Error message
  [key: string]: any;      // Additional context to pass to routes
}
```

### Examples

#### Basic Authentication Guard

```tsx
const authGuard = ({ request }) => {
  const token = request.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return {
      authorized: false,
      status: 401,
      message: "Missing authentication token"
    };
  }
  
  // Validate token (simplified)
  if (token !== "valid-token") {
    return {
      authorized: false,
      status: 401,
      message: "Invalid token"
    };
  }
  
  // Add user to context
  return {
    authorized: true,
    user: { id: "1", name: "John Doe" }
  };
};

<Guard use={authGuard}>
  <Route 
    path="/protected" 
    method="GET" 
    onRequest={(ctx) => ({
      message: "Protected data",
      user: ctx.user // From guard
    })} 
  />
</Guard>
```

#### Role-Based Authorization

```tsx
const adminGuard = ({ request }) => {
  const userRole = request.headers['x-user-role'];
  
  if (userRole !== 'admin') {
    return {
      authorized: false,
      status: 403,
      message: "Admin access required"
    };
  }
  
  return { authorized: true };
};

<Guard use={adminGuard}>
  <Route path="/admin/users" method="DELETE" onRequest={deleteUser} />
</Guard>
```

#### Multiple Guards

```tsx
<Guard use={[authGuard, adminGuard]}>
  {/* Must pass both guards */}
  <Route path="/admin/dashboard" method="GET" onRequest={getAdminDashboard} />
</Guard>
```

#### Nested Guards

```tsx
<Guard use={authGuard}>
  {/* All routes require authentication */}
  <Route path="/profile" method="GET" onRequest={getProfile} />
  
  <Guard use={adminGuard}>
    {/* These routes require authentication AND admin role */}
    <Route path="/admin/settings" method="GET" onRequest={getSettings} />
  </Guard>
</Guard>
```

### Notes

- Guards run **before** route handlers
- Multiple guards run in order
- If any guard fails, the request is rejected
- Guards can add context (like `user`) that's available in route handlers
- Nested guards are cumulative (all must pass)

---

## Middleware

Processes requests before they reach route handlers. Use for logging, CORS, request transformation, etc.

### Props

```typescript
interface MiddlewareProps {
  use: MiddlewareFunction | MiddlewareFunction[];
  children: ReactNode;
}

type MiddlewareFunction = (context: {
  request: FastifyRequest;
  reply: FastifyReply;
  params: any;
  query: any;
  body: any;
}) => void | Promise<void> | MiddlewareResult;

interface MiddlewareResult {
  [key: string]: any; // Context to add to request
}
```

### Examples

#### Logging Middleware

```tsx
const loggingMiddleware = ({ request }) => {
  console.log(`${request.method} ${request.url}`);
};

<Middleware use={loggingMiddleware}>
  <Route path="/api/users" method="GET" onRequest={getUsers} />
</Middleware>
```

#### CORS Middleware

```tsx
const corsMiddleware = ({ reply }) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
};

<Middleware use={corsMiddleware}>
  <Controller path="/api">
    {/* All API routes have CORS headers */}
  </Controller>
</Middleware>
```

#### Request ID Middleware

```tsx
const requestIdMiddleware = ({ request }) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] ${request.method} ${request.url}`);
  
  // Add to context
  return { requestId };
};

<Middleware use={requestIdMiddleware}>
  <Route 
    path="/data" 
    method="GET" 
    onRequest={(ctx) => ({
      data: "...",
      requestId: ctx.requestId // From middleware
    })} 
  />
</Middleware>
```

#### Multiple Middleware

```tsx
<Middleware use={[loggingMiddleware, corsMiddleware, requestIdMiddleware]}>
  {/* All middleware run in order */}
</Middleware>
```

### Notes

- Middleware runs **before** guards and route handlers
- Multiple middleware run in order
- Can modify request/reply objects
- Can add context to pass to guards and route handlers
- Does not block request (unlike guards)

---

## Page

Renders full HTML pages with optional SPA (Single Page Application) support.

### Props

```typescript
interface PageProps {
  title?: string;              // Page title (default: "React App")
  meta?: Array<{               // Meta tags
    name?: string;
    property?: string;
    content: string;
  }>;
  links?: Array<{              // Link tags (stylesheets, etc.)
    rel: string;
    href: string;
    [key: string]: any;
  }>;
  scripts?: Array<{            // External scripts
    src: string;
    [key: string]: any;
  }>;
  styles?: string;             // Inline CSS
  lang?: string;               // HTML lang attribute (default: "en")
  doctype?: string;            // Doctype (default: HTML5)
  htmlAttributes?: object;     // <html> attributes
  bodyAttributes?: object;     // <body> attributes
  rootId?: string;             // Root div ID (default: "root")
  spa?: boolean;               // Enable SPA mode (default: false)
  status?: number;             // HTTP status (default: 200)
  headers?: object;            // Custom HTTP headers
  children?: ReactNode;        // Page content
}
```

### Examples

#### Static HTML Page

```tsx
<Route
  path="/about"
  method="GET"
  onRequest={() => (
    <Page title="About Us" lang="en">
      <div>
        <h1>About Our Company</h1>
        <p>We build great software.</p>
      </div>
    </Page>
  )}
/>
```

#### Page with Meta Tags

```tsx
<Page
  title="My Blog Post"
  meta={[
    { name: "description", content: "An amazing blog post" },
    { property: "og:title", content: "My Blog Post" },
    { property: "og:image", content: "https://example.com/image.jpg" }
  ]}
  links={[
    { rel: "stylesheet", href: "/styles.css" }
  ]}
>
  <article>
    <h1>Blog Post Title</h1>
    <p>Content here...</p>
  </article>
</Page>
```

#### SPA Mode (Interactive React App)

```tsx
// pages/Counter.tsx
"use spa";

import { useState } from "react";

export default function Counter({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>+</button>
      <button onClick={() => setCount(count - 1)}>-</button>
    </div>
  );
}

// server.tsx
<Route
  path="/counter"
  method="GET"
  onRequest={({ query }) => (
    <Page spa={true} title="Counter App">
      <Counter initialCount={parseInt(query.start || "0")} />
    </Page>
  )}
/>
```

### How SPA Mode Works

1. **Component Bundling**: Framework detects the component and bundles it using Vite or Bun
2. **Props Serialization**: Component props are serialized to JSON and served separately
3. **Client Hydration**: Browser loads the bundle and mounts the component with props
4. **Full Interactivity**: All React features work (hooks, state, effects, etc.)

### Notes

- SSR mode (default): Server renders HTML, no client-side React
- SPA mode (`spa={true}`): Full client-side React app with interactivity
- Add `"use spa";` to component files for auto-discovery
- Bundles are cached with MD5 hashes for performance

---

## Response

Declarative HTTP response formatting with custom status, headers, and body.

### Props

```typescript
interface ResponseProps {
  status?: number;        // HTTP status code (default: 200)
  headers?: object;       // HTTP headers
  body?: any;             // Response body (string, object, etc.)
  children?: ReactNode;   // Alternative to body prop
}
```

### Examples

#### Custom Status Code

```tsx
<Route
  path="/not-found"
  method="GET"
  onRequest={() => (
    <Response status={404} body={{ error: "Not Found" }} />
  )}
/>
```

#### Custom Headers

```tsx
<Response
  status={201}
  headers={{
    'Location': '/users/123',
    'X-Custom-Header': 'value'
  }}
  body={{ created: true, id: "123" }}
/>
```

#### HTML Response

```tsx
<Response
  status={200}
  headers={{ 'Content-Type': 'text/html' }}
>
  <html>
    <body>
      <h1>Custom HTML</h1>
    </body>
  </html>
</Response>
```

### Notes

- Use `<Page>` for full HTML pages (it's a specialized `<Response>`)
- `body` prop takes precedence over `children`
- Objects are automatically serialized to JSON
- Can return directly from route handlers

---

## Summary

- **`<App>`**: Root server component
- **`<Controller>`**: Groups routes under a path prefix
- **`<Route>`**: Defines HTTP endpoints
- **`<Guard>`**: Protects routes with authorization logic
- **`<Middleware>`**: Processes requests before handlers
- **`<Page>`**: Renders HTML pages (SSR or SPA)
- **`<Response>`**: Custom HTTP responses

For more examples, check out the [demo application](../examples/demo).
