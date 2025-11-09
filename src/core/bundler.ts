import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { getConfig } from "../config";

// Cache for bundled components
const bundleCache = new Map<string, { code: string; hash: string }>();

export interface BundleOptions {
  minify?: boolean;
  sourcemap?: boolean;
}

/**
 * Bundle a React component file for the browser
 */
export async function bundleComponentFile(filePath: string, options?: BundleOptions): Promise<{ code: string; hash: string }> {
  const config = getConfig();
  let bundler = config.bundler || "bun";

  // Auto-detect: if Bun is not available, use Vite
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

/**
 * Bundle using Bun's built-in bundler
 */
async function bundleWithBun(filePath: string, options?: BundleOptions): Promise<{ code: string; hash: string }> {
  const config = getConfig();
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Component file not found: ${absolutePath}`);
  }

  // Generate hash from file path and content for caching
  const fileContent = fs.readFileSync(absolutePath, "utf-8");
  const hash = crypto
    .createHash("md5")
    .update(absolutePath + fileContent)
    .digest("hex");

  // Check cache
  if (config.cache && bundleCache.has(hash)) {
    return bundleCache.get(hash)!;
  }

  // Create entry file in the same directory as the component so module resolution works
  const componentDir = path.dirname(absolutePath);
  const entryFile = path.join(componentDir, `.entry-${hash}.tsx`);

  // Create entry file that imports the component and sets up client-side rendering
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
    // Use Bun's built-in bundler - output directly to memory
    const build = await Bun.build({
      entrypoints: [entryFile],
      minify: options?.minify ?? config.minify,
      sourcemap: options?.sourcemap ?? config.sourcemap ? "inline" : "none",
      target: "browser",
    });

    if (!build.success) {
      const errorMessages = build.logs
        .map((l) => {
          if (typeof l === "object" && "message" in l) {
            return l.message;
          }
          return String(l);
        })
        .join("\n");
      throw new Error(`Failed to bundle component:\n${errorMessages || "Unknown bundling error"}`);
    }

    if (build.outputs.length === 0) {
      throw new Error("No output from bundler");
    }

    // Read the bundled code directly from Bun's output (no file I/O)
    const code = await build.outputs[0].text();
    const bundle = { code, hash };

    // Cache the result
    if (config.cache) {
      bundleCache.set(hash, bundle);
    }

    // Clean up entry file
    fs.unlinkSync(entryFile);

    return bundle;
  } catch (error) {
    // Clean up on error
    try {
      fs.unlinkSync(entryFile);
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Bundle using Vite
 */
async function bundleWithVite(filePath: string, options?: BundleOptions): Promise<{ code: string; hash: string }> {
  const config = getConfig();
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Component file not found: ${absolutePath}`);
  }

  // Generate hash from file path and content for caching
  const fileContent = fs.readFileSync(absolutePath, "utf-8");
  const hash = crypto
    .createHash("md5")
    .update(absolutePath + fileContent)
    .digest("hex");

  // Check cache
  if (config.cache && bundleCache.has(hash)) {
    return bundleCache.get(hash)!;
  }

  // Dynamically import vite
  let vite: any;
  try {
    // @ts-ignore - Vite is an optional dependency
    vite = await import("vite");
  } catch (error) {
    throw new Error("Vite is not installed. Please run: npm install vite @vitejs/plugin-react");
  }

  // Create entry file in the same directory as the component so module resolution works
  const componentDir = path.dirname(absolutePath);
  const entryFile = path.join(componentDir, `.entry-${hash}.tsx`);
  const outDir = path.join(componentDir, `.vite-out-${hash}`);

  // Create entry file that imports the component and sets up client-side rendering
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
    // Build with Vite
    await vite.build({
      configFile: false,
      logLevel: "error", // Minimize console output
      define: {
        "process.env.NODE_ENV": JSON.stringify(options?.minify ? "production" : "development"),
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
            entryFileNames: "bundle.js",
          },
        },
        write: true,
        target: "es2015",
      },
      plugins: [
        // @ts-ignore - Vite plugin is an optional dependency
        (await import("@vitejs/plugin-react")).default(),
      ],
    });

    // Read the bundled code
    const bundleFile = path.join(outDir, "bundle.js");
    if (!fs.existsSync(bundleFile)) {
      throw new Error("Vite build did not produce expected output");
    }

    const code = fs.readFileSync(bundleFile, "utf-8");
    const bundle = { code, hash };

    // Cache the result
    if (config.cache) {
      bundleCache.set(hash, bundle);
    }

    // Clean up temp files
    try {
      fs.unlinkSync(entryFile);
      fs.rmSync(outDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }

    return bundle;
  } catch (error) {
    // Clean up on error
    try {
      fs.unlinkSync(entryFile);
      fs.rmSync(outDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Clear the bundle cache
 */
export function clearBundleCache(): void {
  bundleCache.clear();
}

/**
 * Get bundle from cache
 */
export function getBundleFromCache(hash: string): { code: string; hash: string } | undefined {
  return bundleCache.get(hash);
}
