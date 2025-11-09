import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { getConfig } from "../../config";
import type { BundleOptions, BundleResult, Bundler } from "./types";

export class BunBundler implements Bundler {
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

      // Clean up entry file
      fs.unlinkSync(entryFile);

      return { code, hash };
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
}
