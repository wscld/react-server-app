import React from "react";
import * as path from "path";

// Component registry for manual registration (optional)
const componentRegistry = new Map<Function, string>();

/**
 * Register a component with its file path
 * Use this in production when using Node.js (not tsx/Bun)
 *
 * @example
 * ```ts
 * import { registerComponent } from 'react-server-app';
 * import LandingPage from './pages/LandingPage';
 *
 * registerComponent(LandingPage, './pages/LandingPage.tsx');
 * ```
 */
export function registerComponent(component: Function, filePath: string) {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  componentRegistry.set(component, absolutePath);
}

/**
 * Extract component information from a React element
 */
export function extractComponentInfo(element: React.ReactElement): {
  filePath: string | null;
  props: Record<string, any>;
  componentName: string | null;
} {
  const component = element.type;

  if (typeof component !== "function") {
    return { filePath: null, props: {}, componentName: null };
  }

  // Get component name
  const componentName = (component as any).displayName || (component as any).name || "Component";

  // Get props
  const props = element.props || {};

  // Try to extract file path from the component function
  let filePath: string | null = null;

  // First check the component registry (for manual registration)
  if (componentRegistry.has(component)) {
    filePath = componentRegistry.get(component)!;
    console.log(`[componentExtractor] Found component ${componentName} in registry: ${filePath}`);
    return { filePath, props, componentName };
  }

  // Try to get from require.cache (works in Bun and Node.js)
  try {
    if (typeof require !== "undefined" && (require as any).cache) {
      const requireCache = (require as any).cache as Record<string, any>;

      // Look through all cached modules
      for (const [modulePath, moduleData] of Object.entries(requireCache)) {
        if (!moduleData || !moduleData.exports) continue;

        // Skip node_modules and built-in modules
        if (modulePath.includes("node_modules") || !modulePath.includes(path.sep)) {
          continue;
        }

        // Check if this module exports our component
        const exports = moduleData.exports;

        // Check default export
        if (exports.default === component) {
          filePath = modulePath;
          console.log(`[componentExtractor] Found component ${componentName} via default export in: ${modulePath}`);
          return { filePath, props, componentName };
        }

        // Check named exports
        if (typeof exports === "object") {
          for (const key of Object.keys(exports)) {
            if (exports[key] === component) {
              filePath = modulePath;
              console.log(`[componentExtractor] Found component ${componentName} via named export '${key}' in: ${modulePath}`);
              return { filePath, props, componentName };
            }
          }
        }
      }
    }
  } catch (e) {
    // Module cache not available
    console.log(`[componentExtractor] require.cache not available:`, (e as Error).message);
  }

  console.log(`[componentExtractor] Could not find file path for component: ${componentName}`);
  console.log(`[componentExtractor] When using Node.js in production, register your component:`);
  console.log(`[componentExtractor]   import { registerComponent } from 'react-server-app';`);
  console.log(`[componentExtractor]   registerComponent(${componentName}, './path/to/${componentName}.tsx');`);
  console.log(`[componentExtractor] Or use Bun/tsx which auto-detect components.`);

  return {
    filePath,
    props,
    componentName,
  };
}

/**
 * Check if a React element is a client component that should be bundled
 */
export function isClientComponent(element: React.ReactElement): boolean {
  // It's a client component if it's a function component (not a built-in DOM element)
  return typeof element.type === "function" && typeof element.type !== "string";
}
