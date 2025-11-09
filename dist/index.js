import React6 from 'react';
import Fastify from 'fastify';
import { renderToString } from 'react-dom/server';
import * as crypto from 'crypto';
import * as fs2 from 'fs';
import * as path2 from 'path';

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
  cache: true,
  spaComponentDirs: ["src", "app", "pages", "components"],
  spaComponentExclude: ["node_modules", "dist", "build", ".next", ".git"]
};
function configure(config) {
  currentConfig = { ...currentConfig, ...config };
}
function getConfig() {
  return { ...currentConfig };
}
var BunBundler = class {
  async bundle(filePath, options) {
    const config = getConfig();
    const absolutePath = path2.isAbsolute(filePath) ? filePath : path2.resolve(process.cwd(), filePath);
    if (!fs2.existsSync(absolutePath)) {
      throw new Error(`Component file not found: ${absolutePath}`);
    }
    const fileContent = fs2.readFileSync(absolutePath, "utf-8");
    const hash = crypto.createHash("md5").update(absolutePath + fileContent).digest("hex");
    const componentDir = path2.dirname(absolutePath);
    const entryFile = path2.join(componentDir, `.entry-${hash}.tsx`);
    const componentName = path2.basename(absolutePath, path2.extname(absolutePath));
    const componentExt = path2.extname(absolutePath);
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
    fs2.writeFileSync(entryFile, clientCode);
    try {
      const build = await Bun.build({
        entrypoints: [entryFile],
        minify: options?.minify ?? config.minify,
        sourcemap: options?.sourcemap ?? config.sourcemap ? "inline" : "none",
        target: "browser"
      });
      if (!build.success) {
        const errorMessages = build.logs.map((l) => {
          if (typeof l === "object" && "message" in l) {
            return l.message;
          }
          return String(l);
        }).join("\n");
        throw new Error(`Failed to bundle component:
${errorMessages || "Unknown bundling error"}`);
      }
      if (build.outputs.length === 0) {
        throw new Error("No output from bundler");
      }
      const code = await build.outputs[0].text();
      fs2.unlinkSync(entryFile);
      return { code, hash };
    } catch (error) {
      try {
        fs2.unlinkSync(entryFile);
      } catch (e) {
      }
      throw error;
    }
  }
};
var ViteBundler = class {
  async bundle(filePath, options) {
    const config = getConfig();
    const absolutePath = path2.isAbsolute(filePath) ? filePath : path2.resolve(process.cwd(), filePath);
    if (!fs2.existsSync(absolutePath)) {
      throw new Error(`Component file not found: ${absolutePath}`);
    }
    const fileContent = fs2.readFileSync(absolutePath, "utf-8");
    const hash = crypto.createHash("md5").update(absolutePath + fileContent).digest("hex");
    let vite;
    try {
      vite = await import('vite');
    } catch (error) {
      throw new Error("Vite is not installed. Please run: npm install vite @vitejs/plugin-react");
    }
    const componentDir = path2.dirname(absolutePath);
    const entryFile = path2.join(componentDir, `.entry-${hash}.tsx`);
    const outDir = path2.join(componentDir, `.vite-out-${hash}`);
    const componentName = path2.basename(absolutePath, path2.extname(absolutePath));
    const componentExt = path2.extname(absolutePath);
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
    fs2.writeFileSync(entryFile, clientCode);
    try {
      await vite.build({
        configFile: false,
        logLevel: "error",
        // Minimize console output
        define: {
          "process.env.NODE_ENV": JSON.stringify(options?.minify ? "production" : "development")
        },
        build: {
          outDir,
          emptyOutDir: true,
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
        ]
      });
      const bundleFile = path2.join(outDir, "bundle.js");
      if (!fs2.existsSync(bundleFile)) {
        throw new Error("Vite build did not produce expected output");
      }
      const code = fs2.readFileSync(bundleFile, "utf-8");
      try {
        fs2.unlinkSync(entryFile);
        fs2.rmSync(outDir, { recursive: true, force: true });
      } catch (e) {
      }
      return { code, hash };
    } catch (error) {
      try {
        fs2.unlinkSync(entryFile);
        fs2.rmSync(outDir, { recursive: true, force: true });
      } catch (e) {
      }
      throw error;
    }
  }
};

// src/core/bundler.ts
var bundleCache = /* @__PURE__ */ new Map();
var bunBundler = null;
var viteBundler = null;
function getBundler() {
  const config = getConfig();
  let bundlerType = config.bundler || "bun";
  if (bundlerType === "bun" && typeof Bun === "undefined") {
    console.log("[bundler] Bun not available, falling back to Vite");
    bundlerType = "vite";
  }
  if (bundlerType === "vite") {
    if (!viteBundler) {
      viteBundler = new ViteBundler();
    }
    return viteBundler;
  } else {
    if (!bunBundler) {
      bunBundler = new BunBundler();
    }
    return bunBundler;
  }
}
async function bundleComponentFile(filePath, options) {
  const config = getConfig();
  const bundler = getBundler();
  const bundle = await bundler.bundle(filePath, options);
  if (config.cache) {
    bundleCache.set(bundle.hash, bundle);
  }
  return bundle;
}
function clearBundleCache() {
  bundleCache.clear();
}
var componentRegistry = /* @__PURE__ */ new Map();
var spaComponentRegistry = null;
function setSpaComponentRegistry(registry) {
  spaComponentRegistry = registry;
}
function registerComponent(component, filePath) {
  const absolutePath = path2.isAbsolute(filePath) ? filePath : path2.resolve(process.cwd(), filePath);
  componentRegistry.set(component, absolutePath);
}
function extractComponentInfo(element) {
  const component = element.type;
  if (typeof component !== "function") {
    return { filePath: null, props: {}, componentName: null };
  }
  const componentName = component.displayName || component.name || "Component";
  const props = element.props || {};
  let filePath = null;
  if (spaComponentRegistry && spaComponentRegistry.has(componentName)) {
    filePath = spaComponentRegistry.get(componentName);
    console.log(`[componentExtractor] Found SPA component ${componentName} in registry: ${filePath}`);
    return { filePath, props, componentName };
  }
  if (componentRegistry.has(component)) {
    filePath = componentRegistry.get(component);
    console.log(`[componentExtractor] Found component ${componentName} in manual registry: ${filePath}`);
    return { filePath, props, componentName };
  }
  try {
    if (typeof __require !== "undefined" && __require.cache) {
      const requireCache = __require.cache;
      for (const [modulePath, moduleData] of Object.entries(requireCache)) {
        if (!moduleData || !moduleData.exports) continue;
        if (modulePath.includes("node_modules") || !modulePath.includes(path2.sep)) {
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
    console.log(`[componentExtractor] require.cache not available:`, e.message);
  }
  console.log(`[componentExtractor] Could not find file path for component: ${componentName}`);
  console.log(`[componentExtractor] Add "use spa" directive to your component file:`);
  console.log(`[componentExtractor]   // ${componentName}.tsx`);
  console.log(`[componentExtractor]   "use spa";`);
  console.log(`[componentExtractor]   `);
  console.log(`[componentExtractor]   export default function ${componentName}() { ... }`);
  return {
    filePath,
    props,
    componentName
  };
}
var watchedFiles = /* @__PURE__ */ new Set();
var fileWatchers = /* @__PURE__ */ new Map();
function watchComponentFile(filePath, onReload) {
  if (watchedFiles.has(filePath)) {
    return;
  }
  watchedFiles.add(filePath);
  const watcher = fs2.watch(filePath, (eventType) => {
    if (eventType === "change") {
      console.log(`[hotReload] File changed: ${filePath}`);
      clearBundleCache();
      onReload?.();
    }
  });
  fileWatchers.set(filePath, watcher);
}
function stopWatching() {
  for (const watcher of fileWatchers.values()) {
    watcher.close();
  }
  fileWatchers.clear();
  watchedFiles.clear();
}
function hasSpaDirective(filePath) {
  try {
    const content = fs2.readFileSync(filePath, "utf-8");
    return /^['"]use spa['"];?\s*$/m.test(content);
  } catch (e) {
    return false;
  }
}
function getExportedComponentName(filePath) {
  try {
    const content = fs2.readFileSync(filePath, "utf-8");
    let match = content.match(/export\s+default\s+(?:function|const|class)\s+(\w+)/);
    if (match) return match[1];
    const defaultMatch = content.match(/export\s+default\s+(\w+)/);
    if (defaultMatch) {
      const componentName = defaultMatch[1];
      if (content.includes(`const ${componentName}`) || content.includes(`function ${componentName}`)) {
        return componentName;
      }
    }
    match = content.match(/export\s+(?:function|const)\s+(\w+)/);
    if (match) return match[1];
    return null;
  } catch (e) {
    return null;
  }
}
function discoverSpaComponents(rootDir, options = {}) {
  const spaComponents = /* @__PURE__ */ new Map();
  const include = options.include || ["src", "app", "pages", "components"];
  const exclude = options.exclude || ["node_modules", "dist", "build", ".next", ".git"];
  function scanDirectory(dir) {
    if (!fs2.existsSync(dir)) return;
    try {
      const entries = fs2.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path2.join(dir, entry.name);
        if (entry.isDirectory()) {
          const shouldExclude = exclude.some((pattern) => entry.name === pattern || entry.name.startsWith("."));
          if (!shouldExclude) {
            scanDirectory(fullPath);
          }
          continue;
        }
        if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          if (hasSpaDirective(fullPath)) {
            const baseName = path2.basename(entry.name, path2.extname(entry.name));
            const componentName = getExportedComponentName(fullPath) || baseName;
            spaComponents.set(componentName, fullPath);
            console.log(`[spaDirective] Discovered SPA component: ${componentName} \u2192 ${fullPath}`);
          }
        }
      }
    } catch (e) {
      console.warn(`[spaDirective] Failed to scan directory: ${dir}`, e);
    }
  }
  for (const dir of include) {
    const fullDir = path2.resolve(rootDir, dir);
    scanDirectory(fullDir);
  }
  return spaComponents;
}
function initializeSpaComponentRegistry(rootDir, options) {
  const workingDir = rootDir || process.cwd();
  console.log('[spaDirective] Scanning for "use spa" components...');
  const discovered = discoverSpaComponents(workingDir, options);
  console.log(`[spaDirective] Found ${discovered.size} SPA component(s)`);
  return discovered;
}
var componentBundles = /* @__PURE__ */ new Map();
var propsScripts = /* @__PURE__ */ new Map();
async function createServer(element) {
  const props = element.props;
  const port = props.port ?? 3e3;
  const host = props.host ?? "0.0.0.0";
  const staticDir = props.staticDir;
  const staticPrefix = props.staticPrefix ?? "/";
  const config = getConfig();
  const spaRegistry = initializeSpaComponentRegistry(void 0, {
    include: config.spaComponentDirs,
    exclude: config.spaComponentExclude
  });
  setSpaComponentRegistry(spaRegistry);
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
    if (process.env.NODE_ENV === "development") {
      reply.header("Cache-Control", "no-cache, no-store, must-revalidate");
      reply.header("Pragma", "no-cache");
      reply.header("Expires", "0");
    } else {
      reply.header("Cache-Control", "public, max-age=31536000, immutable");
    }
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
    if (process.env.NODE_ENV === "development") {
      reply.header("Cache-Control", "no-cache, no-store, must-revalidate");
      reply.header("Pragma", "no-cache");
      reply.header("Expires", "0");
    } else {
      reply.header("Cache-Control", "public, max-age=31536000, immutable");
    }
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
                  if (process.env.NODE_ENV === "development") {
                    watchComponentFile(componentInfo.filePath, () => {
                      const oldHash = clientBundleHash;
                      if (oldHash) {
                        componentBundles.delete(oldHash);
                        fastify.log.info(`Cleared bundle cache for: ${componentInfo.filePath}`);
                      }
                    });
                  }
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

export { App, Controller, Guard, Middleware, Page, Response, Route, collectRoutes, configure, createServer, getConfig, hasSpaDirective, initializeSpaComponentRegistry, registerComponent, stopWatching, useContext as useRequestContext, watchComponentFile };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map