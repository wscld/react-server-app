import React from 'react';
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';

type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
interface RouteContext<TParams = any, TQuery = any, TBody = any> {
    request: FastifyRequest;
    reply: FastifyReply;
    params: TParams;
    query: TQuery;
    body: TBody;
}
interface RouteHandler<TParams = any, TQuery = any, TBody = any, TResponse = any> {
    (context: RouteContext<TParams, TQuery, TBody>): TResponse | Promise<TResponse>;
}
interface Middleware$1<TParams = any, TQuery = any, TBody = any> {
    (context: RouteContext<TParams, TQuery, TBody>, next: () => Promise<void>): Promise<void> | void;
}
interface Guard$1<TParams = any, TQuery = any, TBody = any> {
    (context: RouteContext<TParams, TQuery, TBody>): boolean | Promise<boolean>;
}
interface RouteProps<TParams = any, TQuery = any, TBody = any, TResponse = any> {
    path: string;
    method: HTTPMethod | HTTPMethod[];
    onRequest: RouteHandler<TParams, TQuery, TBody, TResponse>;
    schema?: any;
    guards?: Guard$1[];
    middlewares?: Middleware$1[];
    children?: never;
}
interface ControllerProps {
    path: string;
    guards?: Guard$1[];
    middlewares?: Middleware$1[];
    children: React.ReactNode;
}
interface AppProps {
    port?: number;
    host?: string;
    staticDir?: string;
    staticPrefix?: string;
    children: React.ReactNode;
}
interface CollectedRoute {
    path: string;
    method: HTTPMethod;
    handler: RouteHandler;
    schema?: any;
    guards: Guard$1[];
    middlewares: Middleware$1[];
}

/**
 * App component - root component that starts the Fastify server
 *
 * @example
 * <App port={8080}>
 *   <Controller path="/api">
 *     <Route path="/hello" method="GET" onRequest={() => ({ message: 'Hello' })} />
 *   </Controller>
 * </App>
 */
declare function App(props: AppProps): React.ReactElement;
declare namespace App {
    var displayName: string;
}

/**
 * Controller component - groups routes under a common path prefix
 *
 * @example
 * <Controller path="/api">
 *   <Route path="/users" method="GET" onRequest={() => []} />
 * </Controller>
 */
declare function Controller(props: ControllerProps): React.ReactElement;
declare namespace Controller {
    var displayName: string;
}

/**
 * Route component - defines a single API endpoint
 *
 * @example
 * <Route
 *   path="/users/:id"
 *   method="GET"
 *   onRequest={({ params }) => ({ id: params.id })}
 * />
 */
declare function Route<TParams = any, TQuery = any, TBody = any, TResponse = any>(props: RouteProps<TParams, TQuery, TBody, TResponse>): null;
declare namespace Route {
    var displayName: string;
}

/**
 * Response component - used as a declarative response returned from route handlers
 *
 * Props can be concrete values or functions that receive the current request context
 * (request, reply, params, query, body).
 */
declare function Response(props: {
    json?: any | ((ctx: any) => any);
    status?: number | ((ctx: any) => number);
    headers?: Record<string, string> | ((ctx: any) => Record<string, string>);
    raw?: any;
}): null;
declare namespace Response {
    var displayName: string;
}

interface PageProps {
    /**
     * The React component/elements to render as the page content
     * - For static SSR: pass any React elements
     * - For client-side SPA: pass a single function component (will be auto-bundled)
     */
    children?: React.ReactNode;
    /**
     * Enable client-side rendering (SPA mode)
     * When true, the component in children will be bundled and rendered client-side
     * @default false
     */
    spa?: boolean;
    /**
     * Page title (will be set in <title> tag)
     */
    title?: string | ((ctx: any) => string);
    /**
     * Additional meta tags
     */
    meta?: Array<{
        name?: string;
        property?: string;
        content: string;
    }> | ((ctx: any) => Array<{
        name?: string;
        property?: string;
        content: string;
    }>);
    /**
     * Additional links (stylesheets, etc.)
     */
    links?: Array<{
        rel: string;
        href: string;
        [key: string]: string;
    }> | ((ctx: any) => Array<{
        rel: string;
        href: string;
        [key: string]: string;
    }>);
    /**
     * Scripts to include in the page
     */
    scripts?: Array<{
        src?: string;
        content?: string;
        async?: boolean;
        defer?: boolean;
        type?: string;
    }> | ((ctx: any) => Array<{
        src?: string;
        content?: string;
        async?: boolean;
        defer?: boolean;
        type?: string;
    }>);
    /**
     * Additional CSS to inline in a <style> tag
     */
    styles?: string | ((ctx: any) => string);
    /**
     * HTTP status code
     */
    status?: number | ((ctx: any) => number);
    /**
     * Additional HTTP headers
     */
    headers?: Record<string, string> | ((ctx: any) => Record<string, string>);
    /**
     * Language for the html tag
     */
    lang?: string;
    /**
     * Custom DOCTYPE (defaults to HTML5)
     */
    doctype?: string;
    /**
     * Additional attributes for the <html> tag
     */
    htmlAttributes?: Record<string, string>;
    /**
     * Additional attributes for the <body> tag
     */
    bodyAttributes?: Record<string, string>;
    /**
     * Root element ID for the content container (defaults to 'root')
     */
    rootId?: string;
} /**
 * Page component - renders a full HTML page with optional client-side React SPA
 *
 * The Page component can work in two modes:
 * 1. **Static SSR** (default): Renders React components to static HTML (no client-side JS)
 * 2. **SPA Mode** (spa=true): Bundles your component and renders it client-side with full interactivity
 *
 * @example
 * // Static HTML only (fast, no JavaScript)
 * <Page title="Static Page">
 *   <div><h1>Hello</h1></div>
 * </Page>
 *
 * @example
 * // Interactive SPA with client-side React (useState, useEffect work!)
 * <Page title="Dashboard" spa={true}>
 *   <Dashboard userId={params.id} />
 * </Page>
 */
declare function Page(props: PageProps): null;
declare namespace Page {
    var displayName: string;
}

interface MiddlewareProps {
    use: Middleware$1 | Middleware$1[];
    children: React.ReactNode;
}
/**
 * Middleware component - wraps routes/controllers to apply middleware
 *
 * @example
 * <Middleware use={[loggingMiddleware, corsMiddleware]}>
 *   <Route path="/users" method="GET" onRequest={...} />
 * </Middleware>
 */
declare function Middleware(props: MiddlewareProps): React.ReactElement;
declare namespace Middleware {
    var displayName: string;
}

interface GuardProps {
    use: Guard$1 | Guard$1[];
    children: React.ReactNode;
}
/**
 * Guard component - wraps routes/controllers to apply guards
 *
 * @example
 * <Guard use={[authGuard, adminGuard]}>
 *   <Route path="/admin" method="GET" onRequest={...} />
 * </Guard>
 */
declare function Guard(props: GuardProps): React.ReactElement;
declare namespace Guard {
    var displayName: string;
}

declare function useContext(key: string): (ctx: any) => any;

/**
 * Creates and starts a Fastify server from a React element tree
 *
 * @param element - The root React element (typically <App>)
 * @returns Promise that resolves to the Fastify instance
 */
declare function createServer(element: React.ReactElement): Promise<FastifyInstance>;

/**
 * Recursively traverses a React element tree and collects route definitions
 *
 * @param element - The React element to traverse
 * @param basePath - The accumulated base path from parent Controllers
 * @param parentGuards - Guards from parent Controllers
 * @param parentMiddlewares - Middlewares from parent Controllers
 * @returns Array of collected routes with their full paths and handlers
 */
declare function collectRoutes(element: React.ReactElement | null, basePath?: string, parentGuards?: Guard$1[], parentMiddlewares?: Middleware$1[]): CollectedRoute[];

interface ReactServerAppConfig {
    /**
     * Bundler to use for client-side components
     * @default 'bun'
     */
    bundler?: "bun" | "vite";
    /**
     * Directory to output bundled files (relative to project root)
     * @default '.react-server-app/bundles'
     */
    bundleOutputDir?: string;
    /**
     * Whether to minify the bundled JavaScript
     * @default true
     */
    minify?: boolean;
    /**
     * Whether to generate sourcemaps
     * @default false in production, true in development
     */
    sourcemap?: boolean;
    /**
     * Cache bundled components
     * @default true
     */
    cache?: boolean;
    /**
     * Directories to scan for "use spa" components
     * @default ['src', 'app', 'pages', 'components']
     */
    spaComponentDirs?: string[];
    /**
     * Patterns to exclude when scanning for "use spa" components
     * @default ['node_modules', 'dist', 'build', '.next', '.git']
     */
    spaComponentExclude?: string[];
}
/**
 * Configure the React Server App framework
 */
declare function configure(config: ReactServerAppConfig): void;
/**
 * Get the current configuration
 */
declare function getConfig(): ReactServerAppConfig;

/**
 * Register a component with its file path manually (fallback method)
 *
 * @deprecated Prefer using "use spa" directive at the top of your component file
 *
 * @example
 * ```ts
 * import { registerComponent } from 'react-server-app';
 * import LandingPage from './pages/LandingPage';
 *
 * registerComponent(LandingPage, './pages/LandingPage.tsx');
 * ```
 */
declare function registerComponent(component: Function, filePath: string): void;

/**
 * Watch a component file for changes and clear cache when it changes
 */
declare function watchComponentFile(filePath: string, onReload?: () => void): void;
/**
 * Stop watching all files
 */
declare function stopWatching(): void;

/**
 * Check if a file has the "use spa" directive
 */
declare function hasSpaDirective(filePath: string): boolean;
/**
 * Initialize SPA component registry at server startup
 */
declare function initializeSpaComponentRegistry(rootDir?: string, options?: {
    include?: string[];
    exclude?: string[];
}): Map<string, string>;

export { App, type AppProps, type CollectedRoute, Controller, type ControllerProps, Guard, type Guard$1 as GuardFunction, type HTTPMethod, Middleware, type Middleware$1 as MiddlewareFunction, Page, type PageProps, type ReactServerAppConfig, Response, Route, type RouteContext, type RouteHandler, type RouteProps, collectRoutes, configure, createServer, getConfig, hasSpaDirective, initializeSpaComponentRegistry, registerComponent, stopWatching, useContext as useRequestContext, watchComponentFile };
