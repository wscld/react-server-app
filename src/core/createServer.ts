import Fastify, { FastifyInstance } from "fastify";
import React from "react";
import type { AppProps, RouteContext } from "../types";
import { collectRoutes } from "./collectRoutes";
import { isResponseElement, resolveWithContext } from "./responseUtils";

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
