export interface BundleOptions {
    minify?: boolean;
    sourcemap?: boolean;
}
/**
 * Bundle a React component file for the browser
 */
export declare function bundleComponentFile(filePath: string, options?: BundleOptions): Promise<{
    code: string;
    hash: string;
}>;
/**
 * Clear the bundle cache
 */
export declare function clearBundleCache(): void;
/**
 * Get bundle from cache
 */
export declare function getBundleFromCache(hash: string): {
    code: string;
    hash: string;
} | undefined;
//# sourceMappingURL=bundler.d.ts.map