export interface ReactServerAppConfig {
    /**
     * Bundler to use for client-side components
     * @default 'bun'
     */
    bundler?: "bun" | "vite";
    /**
     * Directory to output bundled files (relative to project root)
     * @default '.react-server-app/bundles'
     */
    bundleOutputDir?: string;
    /**
     * Whether to minify the bundled JavaScript
     * @default true
     */
    minify?: boolean;
    /**
     * Whether to generate sourcemaps
     * @default false in production, true in development
     */
    sourcemap?: boolean;
    /**
     * Cache bundled components
     * @default true
     */
    cache?: boolean;
}
/**
 * Configure the React Server App framework
 */
export declare function configure(config: ReactServerAppConfig): void;
/**
 * Get the current configuration
 */
export declare function getConfig(): ReactServerAppConfig;
//# sourceMappingURL=config.d.ts.map