import Fastify from "fastify";
import React from "react";
import { renderToString } from "react-dom/server";
import { collectRoutes } from "./collectRoutes";
import { isResponseElement, isPageElement, resolveWithContext } from "./responseUtils";
import { bundleComponentFile } from "./bundler";
import { extractComponentInfo } from "./componentExtractor";
// Store for component bundles served as static files
const componentBundles = new Map();
/**
 * Creates and starts a Fastify server from a React element tree
 *
 * @param element - The root React element (typically <App>)
 * @returns Promise that resolves to the Fastify instance
 */
export async function createServer(element) {
    const props = element.props;
    const port = props.port ?? 3000;
    const host = props.host ?? "0.0.0.0";
    // Create Fastify instance
    const fastify = Fastify({
        logger: true,
    });
    // Collect all routes from the React tree (traverse App's children)
    const children = React.Children.toArray(props.children);
    const routes = [];
    for (const child of children) {
        if (React.isValidElement(child)) {
            routes.push(...collectRoutes(child));
        }
    }
    console.log(`\n🚀 Registering ${routes.length} route(s)...\n`);
    // Register route to serve bundled JavaScript files
    fastify.get("/__bundles/:hash.js", async (request, reply) => {
        const { hash } = request.params;
        const bundle = componentBundles.get(hash);
        if (!bundle) {
            reply.code(404);
            return { error: "Bundle not found" };
        }
        reply.header("Content-Type", "application/javascript; charset=utf-8");
        reply.header("Cache-Control", "public, max-age=31536000, immutable");
        return reply.send(bundle);
    });
    // Register routes with Fastify
    for (const route of routes) {
        const method = route.method.toLowerCase();
        const hasGuards = route.guards.length > 0;
        const hasMiddlewares = route.middlewares.length > 0;
        const guardsInfo = hasGuards ? ` [${route.guards.length} guard(s)]` : "";
        const middlewaresInfo = hasMiddlewares ? ` [${route.middlewares.length} middleware(s)]` : "";
        fastify[method](route.path, {
            schema: route.schema,
            handler: async (request, reply) => {
                try {
                    const context = {
                        request,
                        reply,
                        params: request.params,
                        query: request.query,
                        body: request.body,
                    };
                    // attach a few convenience values available to response resolvers
                    context.requestTimestamp = new Date().toISOString();
                    context.ip = (request.headers && (request.headers["x-forwarded-for"] || request.ip)) || request.ip;
                    // Execute guards first
                    for (const guard of route.guards) {
                        const allowed = await guard(context);
                        if (!allowed) {
                            reply.code(403);
                            return { error: "Forbidden", message: "Access denied by guard" };
                        }
                    }
                    // Execute middlewares
                    let middlewareIndex = 0;
                    const executeMiddleware = async () => {
                        if (middlewareIndex < route.middlewares.length) {
                            const middleware = route.middlewares[middlewareIndex++];
                            await middleware(context, executeMiddleware);
                        }
                    };
                    await executeMiddleware();
                    // Execute the main handler
                    const result = await route.handler(context);
                    // If the handler returned a Page element, render it to HTML
                    if (isPageElement(result)) {
                        const props = result.props || {};
                        // Resolve context-based props
                        const title = resolveWithContext(props.title ?? "React App", context);
                        const meta = resolveWithContext(props.meta ?? [], context);
                        const links = resolveWithContext(props.links ?? [], context);
                        const scripts = resolveWithContext(props.scripts ?? [], context);
                        const styles = resolveWithContext(props.styles ?? "", context);
                        const status = resolveWithContext(props.status ?? 200, context);
                        const headers = resolveWithContext(props.headers ?? {}, context);
                        const lang = props.lang ?? "en";
                        const doctype = props.doctype ?? "<!DOCTYPE html>";
                        const htmlAttributes = props.htmlAttributes ?? {};
                        const bodyAttributes = props.bodyAttributes ?? {};
                        const rootId = props.rootId ?? "root";
                        const isSPA = props.spa ?? false;
                        // Handle client-side component bundling for SPA mode
                        let clientBundleHash = null;
                        let clientPropsScript = "";
                        if (isSPA && props.children && React.isValidElement(props.children)) {
                            // Auto-detect and bundle the component
                            const componentInfo = extractComponentInfo(props.children);
                            if (componentInfo.filePath) {
                                try {
                                    fastify.log.info(`Bundling SPA component: ${componentInfo.componentName} from ${componentInfo.filePath}`);
                                    const bundle = await bundleComponentFile(componentInfo.filePath);
                                    clientBundleHash = bundle.hash;
                                    // Store the bundle so we can serve it
                                    componentBundles.set(clientBundleHash, bundle.code);
                                    // Serialize the component props for the client
                                    const serializedProps = JSON.stringify(componentInfo.props);
                                    clientPropsScript = `<script>window.__INITIAL_PROPS__ = ${serializedProps};</script>`;
                                }
                                catch (error) {
                                    fastify.log.error({ error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined }, `Error bundling SPA component from ${componentInfo.filePath}`);
                                    // Continue without client bundle
                                }
                            }
                            else {
                                fastify.log.warn(`SPA mode enabled but could not detect component file path for: ${componentInfo.componentName}`);
                            }
                        }
                        // For client-side SPAs, don't render server-side - just provide empty shell
                        // For static pages, render server-side
                        let contentHtml = "";
                        if (!isSPA && props.children) {
                            // Static server-side rendering only
                            try {
                                contentHtml = renderToString(props.children);
                            }
                            catch (error) {
                                fastify.log.error({ error }, "Error rendering Page content");
                                contentHtml = `<div>Error rendering content: ${error instanceof Error ? error.message : String(error)}</div>`;
                            }
                        }
                        // If SPA mode, contentHtml stays empty - pure client-side rendering
                        // Helper to escape HTML
                        const escapeHtml = (text) => {
                            const map = {
                                "&": "&amp;",
                                "<": "&lt;",
                                ">": "&gt;",
                                '"': "&quot;",
                                "'": "&#039;",
                            };
                            return text.replace(/[&<>"']/g, (char) => map[char]);
                        };
                        // Build HTML attributes string
                        const htmlAttrsString = Object.entries(htmlAttributes)
                            .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
                            .join(" ");
                        // Build body attributes string
                        const bodyAttrsString = Object.entries(bodyAttributes)
                            .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
                            .join(" ");
                        // Build meta tags
                        const metaTags = meta
                            .map((m) => {
                            if (m.property) {
                                return `<meta property="${escapeHtml(m.property)}" content="${escapeHtml(m.content)}">`;
                            }
                            return `<meta name="${escapeHtml(m.name || "")}" content="${escapeHtml(m.content)}">`;
                        })
                            .join("\n    ");
                        // Build link tags
                        const linkTags = links
                            .map((link) => {
                            const attrs = Object.entries(link)
                                .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
                                .join(" ");
                            return `<link ${attrs}>`;
                        })
                            .join("\n    ");
                        // Build script tags
                        const scriptTags = scripts
                            .map((script) => {
                            const attrs = [];
                            if (script.src)
                                attrs.push(`src="${escapeHtml(script.src)}"`);
                            if (script.async)
                                attrs.push("async");
                            if (script.defer)
                                attrs.push("defer");
                            if (script.type)
                                attrs.push(`type="${escapeHtml(script.type)}"`);
                            const attrsString = attrs.join(" ");
                            const content = script.content || "";
                            return `<script ${attrsString}>${content}</script>`;
                        })
                            .join("\n    ");
                        // Build the complete HTML document
                        const html = `${doctype}
<html lang="${escapeHtml(lang)}"${htmlAttrsString ? " " + htmlAttrsString : ""}>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>${metaTags ? "\n    " + metaTags : ""}${linkTags ? "\n    " + linkTags : ""}${styles ? `\n    <style>${styles}</style>` : ""}${clientPropsScript ? "\n    " + clientPropsScript : ""}${scriptTags ? "\n    " + scriptTags : ""}${clientBundleHash ? `\n    <script type="module" src="/__bundles/${clientBundleHash}.js"></script>` : ""}
  </head>
  <body${bodyAttrsString ? " " + bodyAttrsString : ""}>
    <div id="${escapeHtml(rootId)}">${contentHtml}</div>
  </body>
</html>`;
                        // Set headers
                        for (const k of Object.keys(headers || {})) {
                            reply.header(k, headers[k]);
                        }
                        // Set content-type to HTML
                        reply.header("Content-Type", "text/html; charset=utf-8");
                        if (status !== undefined)
                            reply.code(status);
                        return reply.send(html);
                    }
                    // If the handler returned a Response element, resolve it and send
                    if (isResponseElement(result)) {
                        const props = result.props || {};
                        const status = resolveWithContext(props.status ?? 200, context);
                        const headers = resolveWithContext(props.headers ?? {}, context);
                        const json = resolveWithContext(props.json, context);
                        const raw = resolveWithContext(props.raw, context);
                        // set headers
                        for (const k of Object.keys(headers || {})) {
                            reply.header(k, headers[k]);
                        }
                        if (status !== undefined)
                            reply.code(status);
                        if (raw !== undefined) {
                            // send raw value
                            return reply.send(raw);
                        }
                        return reply.send(json);
                    }
                    // If the handler hasn't already sent a response, send the result
                    if (!reply.sent) {
                        return result;
                    }
                }
                catch (error) {
                    fastify.log.error(error);
                    throw error;
                }
            },
        });
        console.log(`  ✓ ${route.method.padEnd(7)} ${route.path}${guardsInfo}${middlewaresInfo}`);
    }
    // Start the server
    try {
        await fastify.listen({ port, host });
        console.log(`\n🎉 Server running at http://${host}:${port}\n`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    return fastify;
}
//# sourceMappingURL=createServer.js.map