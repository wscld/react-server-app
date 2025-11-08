import Fastify, { FastifyInstance } from "fastify";
import React from "react";
import type { AppProps, RouteContext } from "../types";
import { collectRoutes } from "./collectRoutes";
import { isResponseElement, isPageElement, resolveWithContext } from "./responseUtils";

// Dynamically import renderToString to avoid bundling issues
let renderToString: ((element: React.ReactElement) => string) | null = null;
async function ensureReactDOMServer() {
  if (!renderToString) {
    try {
      const ReactDOMServer = await import("react-dom/server");
      renderToString = ReactDOMServer.renderToString;
    } catch (error) {
      console.warn("react-dom/server not available. Page component will not work without it.");
      throw new Error("react-dom is required to use the Page component. Please install it: npm install react-dom");
    }
  }
  return renderToString;
}

/**
 * Creates and starts a Fastify server from a React element tree
 *
 * @param element - The root React element (typically <App>)
 * @returns Promise that resolves to the Fastify instance
 */
export async function createServer(element: React.ReactElement): Promise<FastifyInstance> {
  const props = element.props as AppProps;
  const port = props.port ?? 3000;
  const host = props.host ?? "0.0.0.0";

  // Create Fastify instance
  const fastify = Fastify({
    logger: true,
  });

  // Collect all routes from the React tree (traverse App's children)
  const children = React.Children.toArray(props.children);
  const routes: any[] = [];
  for (const child of children) {
    if (React.isValidElement(child)) {
      routes.push(...collectRoutes(child));
    }
  }

  console.log(`\n🚀 Registering ${routes.length} route(s)...\n`);

  // Register routes with Fastify
  for (const route of routes) {
    const method = route.method.toLowerCase() as "get" | "post" | "put" | "delete" | "patch" | "options" | "head";

    const hasGuards = route.guards.length > 0;
    const hasMiddlewares = route.middlewares.length > 0;
    const guardsInfo = hasGuards ? ` [${route.guards.length} guard(s)]` : "";
    const middlewaresInfo = hasMiddlewares ? ` [${route.middlewares.length} middleware(s)]` : "";

    fastify[method](route.path, {
      schema: route.schema,
      handler: async (request, reply) => {
        try {
          const context: RouteContext = {
            request,
            reply,
            params: request.params as any,
            query: request.query as any,
            body: request.body as any,
          };
          // attach a few convenience values available to response resolvers
          (context as any).requestTimestamp = new Date().toISOString();
          (context as any).ip = (request.headers && (request.headers["x-forwarded-for"] || request.ip)) || request.ip;

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
          const executeMiddleware = async (): Promise<void> => {
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
            const renderFn = await ensureReactDOMServer();
            const props: any = result.props || {};

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

            // Render the React content to static HTML
            let contentHtml = "";
            if (props.children) {
              try {
                if (renderFn) {
                  contentHtml = renderFn(props.children as React.ReactElement);
                }
              } catch (error) {
                fastify.log.error({ error }, "Error rendering Page content");
                contentHtml = `<div>Error rendering content: ${error instanceof Error ? error.message : String(error)}</div>`;
              }
            }

            // Helper to escape HTML
            const escapeHtml = (text: string): string => {
              const map: Record<string, string> = {
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
            const metaTags = (meta as any[])
              .map((m: any) => {
                if (m.property) {
                  return `<meta property="${escapeHtml(m.property)}" content="${escapeHtml(m.content)}">`;
                }
                return `<meta name="${escapeHtml(m.name || "")}" content="${escapeHtml(m.content)}">`;
              })
              .join("\n    ");

            // Build link tags
            const linkTags = (links as any[])
              .map((link: any) => {
                const attrs = Object.entries(link)
                  .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
                  .join(" ");
                return `<link ${attrs}>`;
              })
              .join("\n    ");

            // Build script tags
            const scriptTags = (scripts as any[])
              .map((script: any) => {
                const attrs: string[] = [];
                if (script.src) attrs.push(`src="${escapeHtml(script.src)}"`);
                if (script.async) attrs.push("async");
                if (script.defer) attrs.push("defer");
                if (script.type) attrs.push(`type="${escapeHtml(script.type)}"`);

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
    <title>${escapeHtml(title)}</title>${metaTags ? "\n    " + metaTags : ""}${linkTags ? "\n    " + linkTags : ""}${
              styles ? `\n    <style>${styles}</style>` : ""
            }${scriptTags ? "\n    " + scriptTags : ""}
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

            if (status !== undefined) reply.code(status);

            return reply.send(html);
          }

          // If the handler returned a Response element, resolve it and send
          if (isResponseElement(result)) {
            const props: any = result.props || {};
            const status = resolveWithContext(props.status ?? 200, context);
            const headers = resolveWithContext(props.headers ?? {}, context);
            const json = resolveWithContext(props.json, context);
            const raw = resolveWithContext(props.raw, context);

            // set headers
            for (const k of Object.keys(headers || {})) {
              reply.header(k, headers[k]);
            }

            if (status !== undefined) reply.code(status);

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
        } catch (error) {
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
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  return fastify;
}
