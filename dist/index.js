import React6 from 'react';
import Fastify from 'fastify';
import { renderToString } from 'react-dom/server';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
function App(props) {
  return React6.createElement(React6.Fragment, null, props.children);
}
App.displayName = "App";
function Controller(props) {
  return React6.createElement(React6.Fragment, null, props.children);
}
Controller.displayName = "Controller";

// src/components/Route.tsx
function Route(props) {
  return null;
}
Route.displayName = "Route";

// src/components/Response.tsx
function Response(props) {
  return null;
}
Response.displayName = "Response";

// src/components/Page.tsx
function Page(props) {
  return null;
}
Page.displayName = "Page";
function Middleware(props) {
  return React6.createElement(React6.Fragment, null, props.children);
}
Middleware.displayName = "Middleware";
function Guard(props) {
  return React6.createElement(React6.Fragment, null, props.children);
}
Guard.displayName = "Guard";
function resolveWithContext(value, ctx) {
  if (typeof value === "function") {
    try {
      return value(ctx);
    } catch (err) {
      throw err;
    }
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolveWithContext(v, ctx));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value)) {
      out[key] = resolveWithContext(value[key], ctx);
    }
    return out;
  }
  return value;
}
function useContext(key) {
  return (ctx) => ctx?.[key];
}
function isResponseElement(val) {
  return React6.isValidElement(val) && val.type?.displayName === "Response";
}
function isPageElement(val) {
  return React6.isValidElement(val) && val.type?.displayName === "Page";
}
function collectRoutes(element, basePath = "", parentGuards = [], parentMiddlewares = []) {
  if (!element) {
    return [];
  }
  const routes = [];
  if (element.type === Route) {
    const props2 = element.props;
    const fullPath = joinPaths(basePath, props2.path);
    const methods = Array.isArray(props2.method) ? props2.method : [props2.method];
    const routeGuards = [...parentGuards, ...props2.guards || []];
    const routeMiddlewares = [...parentMiddlewares, ...props2.middlewares || []];
    for (const method of methods) {
      routes.push({
        path: fullPath,
        method,
        handler: props2.onRequest,
        schema: props2.schema,
        guards: routeGuards,
        middlewares: routeMiddlewares
      });
    }
    return routes;
  }
  if (element.type === Controller) {
    const props2 = element.props;
    const newBasePath = joinPaths(basePath, props2.path);
    const controllerGuards = [...parentGuards, ...props2.guards || []];
    const controllerMiddlewares = [...parentMiddlewares, ...props2.middlewares || []];
    const children = React6.Children.toArray(props2.children);
    for (const child of children) {
      if (React6.isValidElement(child)) {
        routes.push(...collectRoutes(child, newBasePath, controllerGuards, controllerMiddlewares));
      }
    }
    return routes;
  }
  if (element.type === Middleware) {
    const props2 = element.props;
    const use = props2.use;
    const middlewares = Array.isArray(use) ? use : [use];
    const newMiddlewares = [...parentMiddlewares, ...middlewares];
    const children = React6.Children.toArray(props2.children);
    for (const child of children) {
      if (React6.isValidElement(child)) {
        routes.push(...collectRoutes(child, basePath, parentGuards, newMiddlewares));
      }
    }
    return routes;
  }
  if (element.type === Guard) {
    const props2 = element.props;
    const use = props2.use;
    const guards = Array.isArray(use) ? use : [use];
    const newGuards = [...parentGuards, ...guards];
    const children = React6.Children.toArray(props2.children);
    for (const child of children) {
      if (React6.isValidElement(child)) {
        routes.push(...collectRoutes(child, basePath, newGuards, parentMiddlewares));
      }
    }
    return routes;
  }
  if (typeof element.type === "function" && element.type !== Route && element.type !== Controller && element.type !== Middleware && element.type !== Guard) {
    const props2 = element.props;
    const Component = element.type;
    let rendered;
    if (Component.prototype && Component.prototype.isReactComponent) {
      const instance = new Component(props2);
      rendered = instance.render();
    } else {
      rendered = Component(props2);
    }
    if (React6.isValidElement(rendered)) {
      routes.push(...collectRoutes(rendered, basePath, parentGuards, parentMiddlewares));
    }
    return routes;
  }
  const props = element.props;
  if (props?.children) {
    const children = React6.Children.toArray(props.children);
    for (const child of children) {
      if (React6.isValidElement(child)) {
        routes.push(...collectRoutes(child, basePath, parentGuards, parentMiddlewares));
      }
    }
  }
  return routes;
}
function joinPaths(...paths) {
  return paths.filter(Boolean).map((p) => p.replace(/^\/+|\/+$/g, "")).filter(Boolean).join("/").replace(/^/, "/");
}

// src/config.ts
var currentConfig = {
  bundler: "bun",
  bundleOutputDir: ".react-server-app/bundles",
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV === "development",
  cache: true
};
function configure(config) {
  currentConfig = { ...currentConfig, ...config };
}
function getConfig() {
  return { ...currentConfig };
}

// src/core/bundler.ts
var bundleCache = /* @__PURE__ */ new Map();
async function bundleComponentFile(filePath, options) {
  const config = getConfig();
  let bundler = config.bundler || "bun";
  if (bundler === "bun" && typeof Bun === "undefined") {
    console.log("[bundler] Bun not available, falling back to Vite");
    bundler = "vite";
  }
  if (bundler === "vite") {
    return bundleWithVite(filePath, options);
  } else {
    return bundleWithBun(filePath, options);
  }
}
async function bundleWithBun(filePath, options) {
  const config = getConfig();
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Component file not found: ${absolutePath}`);
  }
  const fileContent = fs.readFileSync(absolutePath, "utf-8");
  const hash = crypto.createHash("md5").update(absolutePath + fileContent).digest("hex");
  if (config.cache && bundleCache.has(hash)) {
    return bundleCache.get(hash);
  }
  const tmpDir = path.join(os.tmpdir(), "react-server-app-bundles");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const componentDir = path.dirname(absolutePath);
  const entryFile = path.join(componentDir, `.entry-${hash}.tsx`);
  const componentName = path.basename(absolutePath, path.extname(absolutePath));
  const componentExt = path.extname(absolutePath);
  const clientCode = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import ${componentName} from './${componentName}${componentExt}';

// Get initial props from window if they exist
const initialProps = (window as any).__INITIAL_PROPS__ || {};

// Render the app on the client
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(React.createElement(${componentName}, initialProps));
}
`;
  fs.writeFileSync(entryFile, clientCode);
  try {
    console.log("Entry file created:", entryFile);
    console.log("Entry file content:", clientCode);
    console.log("Starting Bun.build with config:", {
      entrypoints: [entryFile],
      outdir: tmpDir,
      naming: { entry: `bundle-${hash}.js` },
      target: "browser"
    });
    let build;
    try {
      build = await Bun.build({
        entrypoints: [entryFile],
        outdir: tmpDir,
        naming: {
          entry: `bundle-${hash}.js`
        },
        minify: options?.minify ?? config.minify,
        sourcemap: options?.sourcemap ?? config.sourcemap ? "inline" : "none",
        target: "browser",
        external: []
        // Bundle all dependencies (don't mark anything as external)
      });
    } catch (buildError) {
      console.error("Bun.build threw an error:", buildError);
      throw new Error(`Bun.build failed: ${buildError instanceof Error ? buildError.message : String(buildError)}`);
    }
    console.log("Bun.build completed. Success:", build.success);
    console.log("Build outputs:", build.outputs.length);
    console.log("Build logs:", build.logs);
    if (!build.success) {
      const errorMessages = build.logs.map((l) => {
        if (typeof l === "object" && "message" in l) {
          return l.message;
        }
        return String(l);
      }).join("\n");
      console.error("Bundle errors:", build.logs);
      throw new Error(`Failed to bundle component:
${errorMessages || "Unknown bundling error"}`);
    }
    if (build.outputs.length === 0) {
      throw new Error("No output from bundler");
    }
    const code = await build.outputs[0].text();
    const bundle = { code, hash };
    if (config.cache) {
      bundleCache.set(hash, bundle);
    }
    try {
      fs.unlinkSync(entryFile);
    } catch (e) {
    }
    return bundle;
  } catch (error) {
    try {
      fs.unlinkSync(entryFile);
    } catch (e) {
    }
    throw error;
  }
}
async function bundleWithVite(filePath, options) {
  const config = getConfig();
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Component file not found: ${absolutePath}`);
  }
  const fileContent = fs.readFileSync(absolutePath, "utf-8");
  const hash = crypto.createHash("md5").update(absolutePath + fileContent).digest("hex");
  if (config.cache && bundleCache.has(hash)) {
    return bundleCache.get(hash);
  }
  let vite;
  try {
    vite = await import('vite');
  } catch (error) {
    throw new Error("Vite is not installed. Please run: npm install vite @vitejs/plugin-react");
  }
  const tmpDir = path.join(os.tmpdir(), "react-server-app-bundles");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const componentDir = path.dirname(absolutePath);
  const entryFile = path.join(componentDir, `.entry-${hash}.tsx`);
  const outDir = path.join(tmpDir, `out-${hash}`);
  const componentName = path.basename(absolutePath, path.extname(absolutePath));
  const componentExt = path.extname(absolutePath);
  const clientCode = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import ${componentName} from './${componentName}${componentExt}';

// Get initial props from window if they exist
const initialProps = (window as any).__INITIAL_PROPS__ || {};

// Render the app on the client
const root = document.getElementById('root');
if (root) {
  createRoot(root).render(React.createElement(${componentName}, initialProps));
}
`;
  fs.writeFileSync(entryFile, clientCode);
  try {
    await vite.build({
      configFile: false,
      define: {
        "process.env.NODE_ENV": JSON.stringify(options?.minify ? "production" : "development")
      },
      build: {
        outDir,
        emptyOutDir: false,
        // Suppress warning about outDir being outside project root
        minify: options?.minify ?? config.minify,
        sourcemap: options?.sourcemap ?? config.sourcemap,
        rollupOptions: {
          input: entryFile,
          output: {
            format: "es",
            entryFileNames: "bundle.js"
          }
        },
        write: true,
        target: "es2015"
      },
      plugins: [
        // @ts-ignore - Vite plugin is an optional dependency
        (await import('@vitejs/plugin-react')).default()
      ],
      logLevel: "warn"
      // Reduce Vite's console output
    });
    const bundleFile = path.join(outDir, "bundle.js");
    if (!fs.existsSync(bundleFile)) {
      throw new Error("Vite build did not produce expected output");
    }
    const code = fs.readFileSync(bundleFile, "utf-8");
    const bundle = { code, hash };
    if (config.cache) {
      bundleCache.set(hash, bundle);
    }
    try {
      fs.unlinkSync(entryFile);
      fs.rmSync(outDir, { recursive: true, force: true });
    } catch (e) {
    }
    return bundle;
  } catch (error) {
    try {
      fs.unlinkSync(entryFile);
      fs.rmSync(outDir, { recursive: true, force: true });
    } catch (e) {
    }
    throw error;
  }
}
var componentRegistry = /* @__PURE__ */ new Map();
function registerComponent(component, filePath) {
  componentRegistry.set(component, filePath);
}
function extractFilePathFromStack(component, componentName) {
  try {
    let capturedStack = "";
    try {
      const funcStr = component.toString();
      const mockElement = React6.createElement(component, {});
    } catch (e) {
    }
    const searchDirs = [
      process.cwd(),
      path.join(process.cwd(), "src"),
      path.join(process.cwd(), "pages"),
      path.join(process.cwd(), "components"),
      path.join(process.cwd(), "examples"),
      path.join(process.cwd(), "demo"),
      path.join(process.cwd(), "../")
    ];
    return searchForComponentRecursive(componentName, searchDirs);
  } catch (e) {
  }
  return null;
}
function searchForComponentRecursive(componentName, searchDirs, maxDepth = 3) {
  const possibleExtensions = [".tsx", ".ts", ".jsx", ".js"];
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;
    const result = searchDirectory(dir, componentName, possibleExtensions, 0, maxDepth);
    if (result) return result;
  }
  return null;
}
function searchDirectory(dir, componentName, extensions, depth, maxDepth) {
  if (depth > maxDepth) return null;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const fileName = path.parse(entry.name).name;
        if (fileName === componentName) {
          for (const ext of extensions) {
            if (entry.name.endsWith(ext)) {
              const fullPath = path.join(dir, entry.name);
              console.log(`[componentExtractor] Found component ${componentName} by recursive search in: ${fullPath}`);
              return fullPath;
            }
          }
        }
      }
    }
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "dist" && entry.name !== "build") {
        const result = searchDirectory(path.join(dir, entry.name), componentName, extensions, depth + 1, maxDepth);
        if (result) return result;
      }
    }
  } catch (e) {
  }
  return null;
}
function extractComponentInfo(element) {
  const component = element.type;
  if (typeof component !== "function") {
    return { filePath: null, props: {}, componentName: null };
  }
  const componentName = component.displayName || component.name || "Component";
  const props = element.props || {};
  let filePath = null;
  if (componentRegistry.has(component)) {
    filePath = componentRegistry.get(component);
    console.log(`[componentExtractor] Found component ${componentName} in registry: ${filePath}`);
    return { filePath, props, componentName };
  }
  try {
    let requireCache;
    if (typeof __require !== "undefined") {
      requireCache = __require.cache;
    }
    if (requireCache) {
      for (const [modulePath, moduleData] of Object.entries(requireCache)) {
        if (!moduleData || !moduleData.exports) continue;
        if (modulePath.includes("node_modules") || !modulePath.includes(path.sep)) {
          continue;
        }
        const exports$1 = moduleData.exports;
        if (exports$1.default === component) {
          filePath = modulePath;
          console.log(`[componentExtractor] Found component ${componentName} via default export in: ${modulePath}`);
          return { filePath, props, componentName };
        }
        if (typeof exports$1 === "object") {
          for (const key of Object.keys(exports$1)) {
            if (exports$1[key] === component) {
              filePath = modulePath;
              console.log(`[componentExtractor] Found component ${componentName} via named export '${key}' in: ${modulePath}`);
              return { filePath, props, componentName };
            }
          }
        }
      }
    }
  } catch (e) {
  }
  filePath = extractFilePathFromStack(component, componentName);
  if (filePath) {
    console.log(`[componentExtractor] Found component ${componentName} via search: ${filePath}`);
    return { filePath, props, componentName };
  }
  console.log(`[componentExtractor] Could not find file path for component: ${componentName}`);
  console.log(`[componentExtractor] Component type:`, typeof component);
  return {
    filePath,
    props,
    componentName
  };
}
var componentBundles = /* @__PURE__ */ new Map();
var propsScripts = /* @__PURE__ */ new Map();
async function createServer(element) {
  const props = element.props;
  const port = props.port ?? 3e3;
  const host = props.host ?? "0.0.0.0";
  const staticDir = props.staticDir;
  const staticPrefix = props.staticPrefix ?? "/";
  const fastify = Fastify({
    logger: true
  });
  if (staticDir) {
    try {
      const fastifyStatic = await import('@fastify/static');
      await fastify.register(fastifyStatic.default, {
        root: staticDir,
        prefix: staticPrefix
      });
      console.log(`\u{1F4C1} Static files enabled: ${staticDir} -> ${staticPrefix}`);
    } catch (error) {
      console.warn("\u26A0\uFE0F  Static file serving requested but @fastify/static is not installed.", "\n   Install it with: bun add @fastify/static");
    }
  }
  const children = React6.Children.toArray(props.children);
  const routes = [];
  for (const child of children) {
    if (React6.isValidElement(child)) {
      routes.push(...collectRoutes(child));
    }
  }
  console.log(`
\u{1F680} Registering ${routes.length} route(s)...
`);
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
  fastify.get("/__props/:hash.js", async (request, reply) => {
    const { hash } = request.params;
    const script = propsScripts.get(hash);
    if (!script) {
      reply.code(404);
      return { error: "Props script not found" };
    }
    reply.header("Content-Type", "application/javascript; charset=utf-8");
    reply.header("Cache-Control", "public, max-age=31536000, immutable");
    return reply.send(script);
  });
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
            body: request.body
          };
          context.requestTimestamp = (/* @__PURE__ */ new Date()).toISOString();
          context.ip = request.headers && (request.headers["x-forwarded-for"] || request.ip) || request.ip;
          for (const guard of route.guards) {
            const allowed = await guard(context);
            if (!allowed) {
              reply.code(403);
              return { error: "Forbidden", message: "Access denied by guard" };
            }
          }
          let middlewareIndex = 0;
          const executeMiddleware = async () => {
            if (middlewareIndex < route.middlewares.length) {
              const middleware = route.middlewares[middlewareIndex++];
              await middleware(context, executeMiddleware);
            }
          };
          await executeMiddleware();
          const result = await route.handler(context);
          if (isPageElement(result)) {
            const props2 = result.props || {};
            const title = resolveWithContext(props2.title ?? "React App", context);
            const meta = resolveWithContext(props2.meta ?? [], context);
            const links = resolveWithContext(props2.links ?? [], context);
            const scripts = resolveWithContext(props2.scripts ?? [], context);
            const styles = resolveWithContext(props2.styles ?? "", context);
            const status = resolveWithContext(props2.status ?? 200, context);
            const headers = resolveWithContext(props2.headers ?? {}, context);
            const lang = props2.lang ?? "en";
            const doctype = props2.doctype ?? "<!DOCTYPE html>";
            const htmlAttributes = props2.htmlAttributes ?? {};
            const bodyAttributes = props2.bodyAttributes ?? {};
            const rootId = props2.rootId ?? "root";
            const isSPA = props2.spa ?? false;
            let clientBundleHash = null;
            let clientPropsHash = null;
            if (isSPA && props2.children && React6.isValidElement(props2.children)) {
              const componentInfo = extractComponentInfo(props2.children);
              if (componentInfo.filePath) {
                try {
                  fastify.log.info(`Bundling SPA component: ${componentInfo.componentName} from ${componentInfo.filePath}`);
                  const bundle = await bundleComponentFile(componentInfo.filePath);
                  clientBundleHash = bundle.hash;
                  componentBundles.set(clientBundleHash, bundle.code);
                  const serializedProps = JSON.stringify(componentInfo.props);
                  const propsScript = `window.__INITIAL_PROPS__ = ${serializedProps};`;
                  clientPropsHash = crypto.createHash("md5").update(propsScript).digest("hex");
                  propsScripts.set(clientPropsHash, propsScript);
                } catch (error) {
                  fastify.log.error(
                    { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : void 0 },
                    `Error bundling SPA component from ${componentInfo.filePath}`
                  );
                }
              } else {
                fastify.log.warn(`SPA mode enabled but could not detect component file path for: ${componentInfo.componentName}`);
              }
            }
            let contentHtml = "";
            if (!isSPA && props2.children) {
              try {
                contentHtml = renderToString(props2.children);
              } catch (error) {
                fastify.log.error({ error }, "Error rendering Page content");
                contentHtml = `<div>Error rendering content: ${error instanceof Error ? error.message : String(error)}</div>`;
              }
            }
            const escapeHtml = (text) => {
              const map = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
              };
              return text.replace(/[&<>"']/g, (char) => map[char]);
            };
            const htmlAttrsString = Object.entries(htmlAttributes).map(([key, value]) => `${key}="${escapeHtml(String(value))}"`).join(" ");
            const bodyAttrsString = Object.entries(bodyAttributes).map(([key, value]) => `${key}="${escapeHtml(String(value))}"`).join(" ");
            const metaTags = meta.map((m) => {
              if (m.property) {
                return `<meta property="${escapeHtml(m.property)}" content="${escapeHtml(m.content)}">`;
              }
              return `<meta name="${escapeHtml(m.name || "")}" content="${escapeHtml(m.content)}">`;
            }).join("\n    ");
            const linkTags = links.map((link) => {
              const attrs = Object.entries(link).map(([key, value]) => `${key}="${escapeHtml(String(value))}"`).join(" ");
              return `<link ${attrs}>`;
            }).join("\n    ");
            const scriptTags = scripts.map((script) => {
              const attrs = [];
              if (script.src) attrs.push(`src="${escapeHtml(script.src)}"`);
              if (script.async) attrs.push("async");
              if (script.defer) attrs.push("defer");
              if (script.type) attrs.push(`type="${escapeHtml(script.type)}"`);
              const attrsString = attrs.join(" ");
              const content = script.content || "";
              return `<script ${attrsString}>${content}</script>`;
            }).join("\n    ");
            const html = `${doctype}
<html lang="${escapeHtml(lang)}"${htmlAttrsString ? " " + htmlAttrsString : ""}>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>${metaTags ? "\n    " + metaTags : ""}${linkTags ? "\n    " + linkTags : ""}${styles ? `
    <style>${styles}</style>` : ""}${scriptTags ? "\n    " + scriptTags : ""}${clientPropsHash ? `
    <script type="module" src="/__props/${clientPropsHash}.js"></script>` : ""}${clientBundleHash ? `
    <script type="module" src="/__bundles/${clientBundleHash}.js"></script>` : ""}
  </head>
  <body${bodyAttrsString ? " " + bodyAttrsString : ""}>
    <div id="${escapeHtml(rootId)}">${contentHtml}</div>
  </body>
</html>`;
            for (const k of Object.keys(headers || {})) {
              reply.header(k, headers[k]);
            }
            reply.header("Content-Type", "text/html; charset=utf-8");
            if (status !== void 0) reply.code(status);
            return reply.send(html);
          }
          if (isResponseElement(result)) {
            const props2 = result.props || {};
            const status = resolveWithContext(props2.status ?? 200, context);
            const headers = resolveWithContext(props2.headers ?? {}, context);
            const json = resolveWithContext(props2.json, context);
            const raw = resolveWithContext(props2.raw, context);
            for (const k of Object.keys(headers || {})) {
              reply.header(k, headers[k]);
            }
            if (status !== void 0) reply.code(status);
            if (raw !== void 0) {
              return reply.send(raw);
            }
            return reply.send(json);
          }
          if (!reply.sent) {
            return result;
          }
        } catch (error) {
          fastify.log.error(error);
          throw error;
        }
      }
    });
    console.log(`  \u2713 ${route.method.padEnd(7)} ${route.path}${guardsInfo}${middlewaresInfo}`);
  }
  try {
    await fastify.listen({ port, host });
    console.log(`
\u{1F389} Server running at http://${host}:${port}
`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  return fastify;
}

export { App, Controller, Guard, Middleware, Page, Response, Route, collectRoutes, configure, createServer, getConfig, registerComponent, useContext as useRequestContext };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map