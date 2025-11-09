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

  /**
   * Directories to scan for "use spa" components
   * @default ['src', 'app', 'pages', 'components']
   */
  spaComponentDirs?: string[];

  /**
   * Patterns to exclude when scanning for "use spa" components
   * @default ['node_modules', 'dist', 'build', '.next', '.git']
   */
  spaComponentExclude?: string[];
}

let currentConfig: ReactServerAppConfig = {
  bundler: "bun",
  bundleOutputDir: ".react-server-app/bundles",
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV === "development",
  cache: true,
  spaComponentDirs: ["src", "app", "pages", "components"],
  spaComponentExclude: ["node_modules", "dist", "build", ".next", ".git"],
};

/**
 * Configure the React Server App framework
 */
export function configure(config: ReactServerAppConfig): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Get the current configuration
 */
export function getConfig(): ReactServerAppConfig {
  return { ...currentConfig };
}
