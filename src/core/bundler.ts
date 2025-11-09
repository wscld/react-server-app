import { getConfig } from "../config";
import { BunBundler, ViteBundler } from "./bundlers";
import type { BundleOptions, BundleResult, Bundler } from "./bundlers";

// Cache for bundled components
const bundleCache = new Map<string, BundleResult>();

// Bundler instances
let bunBundler: Bundler | null = null;
let viteBundler: Bundler | null = null;

/**
 * Get or create bundler instance
 */
function getBundler(): Bundler {
  const config = getConfig();
  let bundlerType = config.bundler || "bun";

  // Auto-detect: if Bun is not available, use Vite
  if (bundlerType === "bun" && typeof Bun === "undefined") {
    console.log("[bundler] Bun not available, falling back to Vite");
    bundlerType = "vite";
  }

  if (bundlerType === "vite") {
    if (!viteBundler) {
      viteBundler = new ViteBundler();
    }
    return viteBundler;
  } else {
    if (!bunBundler) {
      bunBundler = new BunBundler();
    }
    return bunBundler;
  }
}

/**
 * Bundle a React component file for the browser
 */
export async function bundleComponentFile(filePath: string, options?: BundleOptions): Promise<BundleResult> {
  const config = getConfig();
  const bundler = getBundler();

  // Generate a cache key from the file path
  const bundle = await bundler.bundle(filePath, options);

  // Cache the result
  if (config.cache) {
    bundleCache.set(bundle.hash, bundle);
  }

  return bundle;
}

/**
 * Clear the bundle cache
 */
export function clearBundleCache(): void {
  bundleCache.clear();
}

/**
 * Get bundle from cache
 */
export function getBundleFromCache(hash: string): BundleResult | undefined {
  return bundleCache.get(hash);
}

// Re-export types for convenience
export type { BundleOptions, BundleResult, Bundler } from "./bundlers";
