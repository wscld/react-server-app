import React from "react";
import * as path from "path";
import * as fs from "fs";
// Component registry for manual registration
const componentRegistry = new Map();
/**
 * Register a component with its file path (useful for ES modules in Node.js)
 */
export function registerComponent(component, filePath) {
    componentRegistry.set(component, filePath);
}
/**
 * Try to extract file path from Error stack trace
 */
function extractFilePathFromStack(component, componentName) {
    try {
        // Trigger component execution to get its stack trace
        // Create a custom error inside the component's context
        let capturedStack = '';
        try {
            // Try to call toString on the component to see its source
            const funcStr = component.toString();
            // Create an error from within a mock render
            const mockElement = React.createElement(component, {});
            // The stack trace from here won't help, we need a different approach
        }
        catch (e) {
            // Ignore
        }
        // Alternative: Look at where the component was imported from
        // by examining all modules and finding files that might contain this component name
        const searchDirs = [
            process.cwd(),
            path.join(process.cwd(), 'src'),
            path.join(process.cwd(), 'pages'),
            path.join(process.cwd(), 'components'),
            path.join(process.cwd(), 'examples'),
            path.join(process.cwd(), 'demo'),
            path.join(process.cwd(), '../'),
        ];
        // Recursively search for files with the component name
        return searchForComponentRecursive(componentName, searchDirs);
    }
    catch (e) {
        // Ignore errors
    }
    return null;
}
/**
 * Recursively search for a component file
 */
function searchForComponentRecursive(componentName, searchDirs, maxDepth = 3) {
    const possibleExtensions = ['.tsx', '.ts', '.jsx', '.js'];
    for (const dir of searchDirs) {
        if (!fs.existsSync(dir))
            continue;
        const result = searchDirectory(dir, componentName, possibleExtensions, 0, maxDepth);
        if (result)
            return result;
    }
    return null;
}
/**
 * Search a directory recursively
 */
function searchDirectory(dir, componentName, extensions, depth, maxDepth) {
    if (depth > maxDepth)
        return null;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        // First check files in current directory
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
        // Then recurse into subdirectories
        for (const entry of entries) {
            if (entry.isDirectory() &&
                !entry.name.startsWith('.') &&
                entry.name !== 'node_modules' &&
                entry.name !== 'dist' &&
                entry.name !== 'build') {
                const result = searchDirectory(path.join(dir, entry.name), componentName, extensions, depth + 1, maxDepth);
                if (result)
                    return result;
            }
        }
    }
    catch (e) {
        // Skip directories we can't read
    }
    return null;
}
/**
 * Extract component information from a React element
 */
export function extractComponentInfo(element) {
    const component = element.type;
    if (typeof component !== "function") {
        return { filePath: null, props: {}, componentName: null };
    }
    // Get component name
    const componentName = component.displayName || component.name || "Component";
    // Get props
    const props = element.props || {};
    // Try to extract file path from the component function
    let filePath = null;
    // First check the component registry (for manual registration)
    if (componentRegistry.has(component)) {
        filePath = componentRegistry.get(component);
        console.log(`[componentExtractor] Found component ${componentName} in registry: ${filePath}`);
        return { filePath, props, componentName };
    }
    // Try to get from require.cache (works in Bun and Node.js CommonJS)
    try {
        let requireCache;
        if (typeof require !== "undefined") {
            requireCache = require.cache;
        }
        if (requireCache) {
            // Look through all cached modules
            for (const [modulePath, moduleData] of Object.entries(requireCache)) {
                if (!moduleData || !moduleData.exports)
                    continue;
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
    }
    catch (e) {
        // Module cache not available
    }
    // Try stack trace approach (now uses recursive search)
    filePath = extractFilePathFromStack(component, componentName);
    if (filePath) {
        console.log(`[componentExtractor] Found component ${componentName} via search: ${filePath}`);
        return { filePath, props, componentName };
    }
    // The recursive search is already done in extractFilePathFromStack
    // No need for additional search here
    console.log(`[componentExtractor] Could not find file path for component: ${componentName}`);
    console.log(`[componentExtractor] Component type:`, typeof component);
    return {
        filePath,
        props,
        componentName,
    };
}
/**
 * Check if a React element is a client component that should be bundled
 */
export function isClientComponent(element) {
    // It's a client component if it's a function component (not a built-in DOM element)
    return typeof element.type === "function" && typeof element.type !== "string";
}
//# sourceMappingURL=componentExtractor.js.map