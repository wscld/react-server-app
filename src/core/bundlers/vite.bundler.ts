import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { getConfig } from "../../config";
import type { BundleOptions, BundleResult, Bundler } from "./types";

export class ViteBundler implements Bundler {
  async bundle(filePath: string, options?: BundleOptions): Promise<BundleResult> {
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

      // Clean up temp files
      try {
        fs.unlinkSync(entryFile);
        fs.rmSync(outDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }

      return { code, hash };
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
}
