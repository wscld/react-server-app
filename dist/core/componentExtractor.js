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
    // This is a heuristic approach - we look for the component in the require cache
    let filePath = null;
    // In Bun/Node, we can check the module cache
    if (typeof require !== "undefined" && require.cache) {
        // Look through all cached modules
        for (const [modulePath, moduleData] of Object.entries(require.cache)) {
            if (!moduleData || !moduleData.exports)
                continue;
            // Check if this module exports our component
            const exports = moduleData.exports;
            // Check default export
            if (exports.default === component) {
                filePath = modulePath;
                break;
            }
            // Check named exports
            if (typeof exports === "object") {
                for (const key of Object.keys(exports)) {
                    if (exports[key] === component) {
                        filePath = modulePath;
                        break;
                    }
                }
            }
            if (filePath)
                break;
        }
    }
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