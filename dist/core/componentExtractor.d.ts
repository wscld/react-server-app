import React from "react";
/**
 * Register a component with its file path (useful for ES modules in Node.js)
 */
export declare function registerComponent(component: Function, filePath: string): void;
/**
 * Extract component information from a React element
 */
export declare function extractComponentInfo(element: React.ReactElement): {
    filePath: string | null;
    props: Record<string, any>;
    componentName: string | null;
};
/**
 * Check if a React element is a client component that should be bundled
 */
export declare function isClientComponent(element: React.ReactElement): boolean;
//# sourceMappingURL=componentExtractor.d.ts.map