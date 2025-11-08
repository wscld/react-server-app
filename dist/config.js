let currentConfig = {
    bundler: "bun",
    bundleOutputDir: ".react-server-app/bundles",
    minify: process.env.NODE_ENV === "production",
    sourcemap: process.env.NODE_ENV === "development",
    cache: true,
};
/**
 * Configure the React Server App framework
 */
export function configure(config) {
    currentConfig = { ...currentConfig, ...config };
}
/**
 * Get the current configuration
 */
export function getConfig() {
    return { ...currentConfig };
}
//# sourceMappingURL=config.js.map