import React from 'react';

export interface PageProps {
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
    meta?: Array<{ name?: string; property?: string; content: string }> | ((ctx: any) => Array<{ name?: string; property?: string; content: string }>);

    /**
     * Additional links (stylesheets, etc.)
     */
    links?: Array<{ rel: string; href: string;[key: string]: string }> | ((ctx: any) => Array<{ rel: string; href: string;[key: string]: string }>);

    /**
     * Scripts to include in the page
     */
    scripts?: Array<{ src?: string; content?: string; async?: boolean; defer?: boolean; type?: string }> | ((ctx: any) => Array<{ src?: string; content?: string; async?: boolean; defer?: boolean; type?: string }>);

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
}/**
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
export function Page(props: PageProps): null {
    // This component is not rendered; it's inspected by the server at runtime
    return null;
}

Page.displayName = 'Page';

export default Page;
