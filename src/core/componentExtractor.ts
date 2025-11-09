import React from "react";
import * as path from "path";

// Component registry for manual registration (optional)
const componentRegistry = new Map<Function, string>();

/**
 * Register a component with its file path
 * This is optional - most users won't need this as require.cache works automatically
 */
export function registerComponent(component: Function, filePath: string) {
  componentRegistry.set(component, filePath);
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
  console.log(`[componentExtractor] Tip: Make sure you're using Bun, or tsx/ts-node with Node.js`);

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
