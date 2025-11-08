import React from 'react';
export interface PageProps {
    /**
     * The React component/elements to render as the page content
     */
    children: React.ReactNode;
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
 * Page component - renders a full HTML page with React DOM content as an SPA
 *
 * @example
 * <Route
 *   path="/dashboard"
 *   method="GET"
 *   onRequest={() => (
 *     <Page title="Dashboard">
 *       <div>
 *         <h1>Welcome to Dashboard</h1>
 *         <p>This is a React SPA!</p>
 *       </div>
 *     </Page>
 *   )}
 * />
 */
export declare function Page(props: PageProps): null;
export declare namespace Page {
    var displayName: string;
}
export default Page;
//# sourceMappingURL=Page.d.ts.map