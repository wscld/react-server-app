# Guards & Middleware Guide

Learn how to use **Guards** and **Middleware** to add authentication, authorization, logging, and request processing to your react-server-app.

## Table of Contents

- [Understanding Guards vs Middleware](#understanding-guards-vs-middleware)
- [Guards](#guards)
  - [Basic Authentication](#basic-authentication)
  - [Role-Based Access Control](#role-based-access-control)
  - [Multiple Guards](#multiple-guards)
  - [Adding Context](#adding-context)
- [Middleware](#middleware)
  - [Request Logging](#request-logging)
  - [CORS Headers](#cors-headers)
  - [Request Transformation](#request-transformation)
  - [Performance Monitoring](#performance-monitoring)
- [Combining Guards and Middleware](#combining-guards-and-middleware)
- [Best Practices](#best-practices)

---

## Understanding Guards vs Middleware

### Guards

- **Purpose**: Authorization and access control
- **Can Block**: Yes - returns `authorized: false` to reject requests
- **Returns**: Authorization result with optional context
- **Use Cases**: Authentication, role checks, rate limiting

### Middleware

- **Purpose**: Request/response processing
- **Can Block**: No - always lets request continue
- **Returns**: Optional context to add to request
- **Use Cases**: Logging, CORS, request ID, performance monitoring

### Execution Order

```
Request → Middleware → Guards → Route Handler → Response
```

---

## Guards

### Basic Authentication

Verify user credentials before allowing access.

```tsx
import { Guard } from "react-server-app";

// Simple token-based auth
const authGuard = ({ request }) => {
  const token = request.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return {
      authorized: false,
      status: 401,
      message: "Missing authentication token"
    };
  }
  
  // Validate token (simplified example)
  const user = validateToken(token);
  
  if (!user) {
    return {
      authorized: false,
      status: 401,
      message: "Invalid or expired token"
    };
  }
  
  // Pass user to route handler
  return {
    authorized: true,
    user
  };
};

// Protect routes
<Guard use={authGuard}>
  <Route 
    path="/profile" 
    method="GET" 
    onRequest={(ctx) => ({
      profile: ctx.user // From guard
    })} 
  />
  
  <Route 
    path="/settings" 
    method="GET" 
    onRequest={(ctx) => ({
      settings: getUserSettings(ctx.user.id)
    })} 
  />
</Guard>
```

**Testing:**

```bash
# Without token - 401 Unauthorized
curl http://localhost:3000/profile

# With valid token
curl -H "Authorization: Bearer valid-token" http://localhost:3000/profile
```

### Role-Based Access Control

Restrict routes based on user roles.

```tsx
const adminGuard = ({ request }) => {
  const user = request.user; // Assume set by earlier guard/middleware
  
  if (!user) {
    return {
      authorized: false,
      status: 401,
      message: "Authentication required"
    };
  }
  
  if (user.role !== 'admin') {
    return {
      authorized: false,
      status: 403,
      message: "Admin access required"
    };
  }
  
  return { authorized: true };
};

// Admin-only routes
<Guard use={adminGuard}>
  <Controller path="/admin">
    <Route path="/users" method="GET" onRequest={getAllUsers} />
    <Route path="/users/:id" method="DELETE" onRequest={deleteUser} />
    <Route path="/settings" method="PUT" onRequest={updateSettings} />
  </Controller>
</Guard>
```

### Multiple Guards

Chain guards for complex authorization logic.

```tsx
const guards = [authGuard, adminGuard];

// Both guards must pass
<Guard use={guards}>
  <Route path="/admin/dashboard" method="GET" onRequest={getAdminDashboard} />
</Guard>
```

Or nest them:

```tsx
<Guard use={authGuard}>
  {/* All routes require authentication */}
  <Route path="/profile" method="GET" onRequest={getProfile} />
  
  <Guard use={adminGuard}>
    {/* These also require admin role */}
    <Route path="/admin" method="GET" onRequest={getAdmin} />
  </Guard>
</Guard>
```

### Adding Context

Guards can enrich the request context for downstream handlers.

```tsx
const sessionGuard = async ({ request }) => {
  const sessionId = request.cookies.sessionId;
  
  if (!sessionId) {
    return {
      authorized: false,
      status: 401,
      message: "No session found"
    };
  }
  
  // Load session from database
  const session = await getSession(sessionId);
  
  if (!session || session.expired) {
    return {
      authorized: false,
      status: 401,
      message: "Session expired"
    };
  }
  
  // Add session and user to context
  return {
    authorized: true,
    session,
    user: session.user,
    permissions: session.permissions
  };
};

<Guard use={sessionGuard}>
  <Route 
    path="/dashboard" 
    method="GET" 
    onRequest={(ctx) => ({
      user: ctx.user,
      session: ctx.session,
      permissions: ctx.permissions
    })} 
  />
</Guard>
```

### Rate Limiting Guard

Prevent abuse by limiting request frequency.

```tsx
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const rateLimitGuard = ({ request }) => {
  const ip = request.ip;
  const now = Date.now();
  const limit = 100; // requests per minute
  const window = 60 * 1000; // 1 minute
  
  let record = requestCounts.get(ip);
  
  // Reset if window expired
  if (!record || record.resetAt < now) {
    record = { count: 0, resetAt: now + window };
    requestCounts.set(ip, record);
  }
  
  record.count++;
  
  if (record.count > limit) {
    return {
      authorized: false,
      status: 429,
      message: "Rate limit exceeded"
    };
  }
  
  return { authorized: true };
};

<Guard use={rateLimitGuard}>
  <Controller path="/api">
    {/* All API routes are rate-limited */}
  </Controller>
</Guard>
```

---

## Middleware

### Request Logging

Log all incoming requests.

```tsx
import { Middleware } from "react-server-app";

const loggingMiddleware = ({ request }) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${request.method} ${request.url}`);
};

<Middleware use={loggingMiddleware}>
  <Controller path="/api">
    {/* All API requests are logged */}
  </Controller>
</Middleware>
```

### CORS Headers

Enable Cross-Origin Resource Sharing.

```tsx
const corsMiddleware = ({ reply }) => {
  reply.header('Access-Control-Allow-Origin', '*');
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

<Middleware use={corsMiddleware}>
  <Controller path="/api">
    {/* All API routes have CORS headers */}
  </Controller>
</Middleware>
```

### Request Transformation

Modify requests before they reach handlers.

```tsx
const bodyParserMiddleware = ({ request }) => {
  // Parse custom header format
  if (request.headers['x-custom-format']) {
    const parsed = parseCustomFormat(request.body);
    return { customData: parsed };
  }
};

<Middleware use={bodyParserMiddleware}>
  <Route 
    path="/data" 
    method="POST" 
    onRequest={(ctx) => ({
      received: ctx.customData // From middleware
    })} 
  />
</Middleware>
```

### Performance Monitoring

Track request duration and performance metrics.

```tsx
const performanceMiddleware = ({ request }) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  // Log when request completes (use reply.raw for access to finish event)
  const originalEnd = request.raw.end;
  request.raw.end = function(...args) {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ${request.method} ${request.url} - ${duration}ms`);
    return originalEnd.apply(this, args);
  };
  
  return { requestId, startTime };
};

<Middleware use={performanceMiddleware}>
  <Route 
    path="/slow-endpoint" 
    method="GET" 
    onRequest={async (ctx) => {
      await someSlowOperation();
      return { 
        requestId: ctx.requestId,
        message: "Done" 
      };
    }} 
  />
</Middleware>
```

### Request ID Middleware

Add unique ID to every request for tracing.

```tsx
const requestIdMiddleware = ({ request, reply }) => {
  const requestId = crypto.randomUUID();
  
  // Add to response headers
  reply.header('X-Request-ID', requestId);
  
  // Log with ID
  console.log(`[${requestId}] ${request.method} ${request.url}`);
  
  // Add to context
  return { requestId };
};

<Middleware use={requestIdMiddleware}>
  <Controller path="/api">
    <Route 
      path="/error" 
      method="GET" 
      onRequest={(ctx) => {
        try {
          throw new Error("Something went wrong");
        } catch (error) {
          console.error(`[${ctx.requestId}] Error:`, error);
          return { error: "Internal error", requestId: ctx.requestId };
        }
      }} 
    />
  </Controller>
</Middleware>
```

---

## Combining Guards and Middleware

Layer multiple guards and middleware for comprehensive request handling.

```tsx
import { App, Controller, Route, Guard, Middleware, createServer } from "react-server-app";

const server = (
  <App port={3000}>
    {/* Global middleware - runs for all routes */}
    <Middleware use={[loggingMiddleware, corsMiddleware, requestIdMiddleware]}>
      
      {/* Public routes - no authentication */}
      <Route path="/health" method="GET" onRequest={() => ({ status: "ok" })} />
      <Route path="/login" method="POST" onRequest={handleLogin} />
      
      {/* Protected routes - authentication required */}
      <Guard use={authGuard}>
        <Route path="/profile" method="GET" onRequest={getProfile} />
        
        {/* Rate-limited API */}
        <Guard use={rateLimitGuard}>
          <Controller path="/api">
            <Route path="/data" method="GET" onRequest={getData} />
          </Controller>
        </Guard>
        
        {/* Admin-only routes */}
        <Guard use={adminGuard}>
          <Controller path="/admin">
            <Route path="/users" method="GET" onRequest={getAllUsers} />
            <Route path="/settings" method="PUT" onRequest={updateSettings} />
          </Controller>
        </Guard>
      </Guard>
    </Middleware>
  </App>
);

createServer(server);
```

**Execution order for `/admin/users`:**

1. `loggingMiddleware` - Logs request
2. `corsMiddleware` - Adds CORS headers
3. `requestIdMiddleware` - Adds request ID
4. `authGuard` - Checks authentication
5. `rateLimitGuard` - Checks rate limit
6. `adminGuard` - Checks admin role
7. `getAllUsers` - Route handler
8. Response sent

---

## Best Practices

### 1. Keep Guards Focused

Each guard should have a single responsibility.

```tsx
// ✅ Good - focused guards
const authGuard = ({ request }) => { /* ... */ };
const adminGuard = ({ request }) => { /* ... */ };
const rateLimitGuard = ({ request }) => { /* ... */ };

// ❌ Bad - god guard doing everything
const megaGuard = ({ request }) => {
  // Authentication
  // Authorization
  // Rate limiting
  // Logging
  // ...
};
```

### 2. Use Middleware for Cross-Cutting Concerns

Things that apply to many routes belong in middleware.

```tsx
// ✅ Good
<Middleware use={[loggingMiddleware, corsMiddleware]}>
  {/* All routes get logging and CORS */}
</Middleware>

// ❌ Bad - repeating logic in every route
<Route 
  path="/users" 
  method="GET" 
  onRequest={({ request, reply }) => {
    console.log(request.method, request.url); // Repeated
    reply.header('Access-Control-Allow-Origin', '*'); // Repeated
    return getUsers();
  }} 
/>
```

### 3. Add Context, Don't Mutate

Return new context instead of mutating request objects.

```tsx
// ✅ Good
const authGuard = ({ request }) => {
  const user = validateToken(request.headers.authorization);
  return { authorized: true, user }; // Return context
};

// ❌ Bad
const authGuard = ({ request }) => {
  request.user = validateToken(request.headers.authorization); // Mutation
  return { authorized: true };
};
```

### 4. Use TypeScript for Type Safety

Define guard and middleware types.

```tsx
import { GuardFunction, MiddlewareFunction } from "react-server-app";

interface User {
  id: string;
  name: string;
  role: string;
}

const authGuard: GuardFunction = ({ request }) => {
  const user = validateToken(request.headers.authorization);
  
  if (!user) {
    return { authorized: false, status: 401 };
  }
  
  return { authorized: true, user };
};
```

### 5. Handle Errors Gracefully

Always provide clear error messages.

```tsx
const authGuard = ({ request }) => {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      return {
        authorized: false,
        status: 401,
        message: "Authentication token required"
      };
    }
    
    const user = validateToken(token);
    return { authorized: true, user };
    
  } catch (error) {
    console.error("Auth guard error:", error);
    return {
      authorized: false,
      status: 500,
      message: "Authentication service unavailable"
    };
  }
};
```

### 6. Test Guards Independently

Guards should be pure functions that are easy to test.

```tsx
// Easy to test
const authGuard = ({ request }) => {
  const token = request.headers.authorization?.replace("Bearer ", "");
  if (!token) return { authorized: false, status: 401 };
  
  const user = validateToken(token);
  if (!user) return { authorized: false, status: 401 };
  
  return { authorized: true, user };
};

// Test it
const mockRequest = {
  headers: { authorization: "Bearer valid-token" }
};

const result = authGuard({ request: mockRequest });
console.assert(result.authorized === true);
```

---

## Examples

### Complete Authentication System

```tsx
import { App, Controller, Route, Guard, Middleware, createServer } from "react-server-app";

// Middleware
const loggingMiddleware = ({ request }) => {
  console.log(`${request.method} ${request.url}`);
};

const corsMiddleware = ({ reply }) => {
  reply.header('Access-Control-Allow-Origin', '*');
};

// Guards
const authGuard = ({ request }) => {
  const token = request.headers.authorization?.replace("Bearer ", "");
  if (!token) return { authorized: false, status: 401 };
  
  const user = validateToken(token);
  if (!user) return { authorized: false, status: 401 };
  
  return { authorized: true, user };
};

const adminGuard = ({ user }) => {
  if (user?.role !== 'admin') {
    return { authorized: false, status: 403 };
  }
  return { authorized: true };
};

// Server
const server = (
  <App port={3000}>
    <Middleware use={[loggingMiddleware, corsMiddleware]}>
      {/* Public */}
      <Route path="/login" method="POST" onRequest={handleLogin} />
      
      {/* Authenticated */}
      <Guard use={authGuard}>
        <Route path="/profile" method="GET" onRequest={(ctx) => ctx.user} />
        
        {/* Admin only */}
        <Guard use={adminGuard}>
          <Controller path="/admin">
            <Route path="/users" method="GET" onRequest={getAllUsers} />
          </Controller>
        </Guard>
      </Guard>
    </Middleware>
  </App>
);

createServer(server);
```

See the [demo application](../examples/demo) for more real-world examples!
