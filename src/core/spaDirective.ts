import * as fs from "fs";
import * as path from "path";

/**
 * Check if a file has the "use spa" directive
 */
export function hasSpaDirective(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Match "use spa" or 'use spa' at the start of the file (ignoring whitespace/comments)
    return /^['"]use spa['"];?\s*$/m.test(content);
  } catch (e) {
    return false;
  }
}

/**
 * Extract the exported component name from a file
 * Handles: export default ComponentName, export { ComponentName }, etc.
 */
function getExportedComponentName(filePath: string): string | null {
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    // Match: export default function ComponentName
    let match = content.match(/export\s+default\s+(?:function|const|class)\s+(\w+)/);
    if (match) return match[1];

    // Match: const ComponentName = ... \n export default ComponentName
    const defaultMatch = content.match(/export\s+default\s+(\w+)/);
    if (defaultMatch) {
      const componentName = defaultMatch[1];
      // Verify it's defined in the file (not just re-exported)
      if (content.includes(`const ${componentName}`) || content.includes(`function ${componentName}`)) {
        return componentName;
      }
    }

    // Match: export function ComponentName or export const ComponentName
    match = content.match(/export\s+(?:function|const)\s+(\w+)/);
    if (match) return match[1];

    // Fallback: use filename
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Discover all SPA components in a directory recursively
 */
export function discoverSpaComponents(
  rootDir: string,
  options: {
    include?: string[]; // directories to scan
    exclude?: string[]; // patterns to exclude
  } = {}
): Map<string, string> {
  const spaComponents = new Map<string, string>();
  const include = options.include || ["src", "app", "pages", "components"];
  const exclude = options.exclude || ["node_modules", "dist", "build", ".next", ".git"];

  function scanDirectory(dir: string) {
    if (!fs.existsSync(dir)) return;

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip excluded directories
        if (entry.isDirectory()) {
          const shouldExclude = exclude.some((pattern) => entry.name === pattern || entry.name.startsWith("."));
          if (!shouldExclude) {
            scanDirectory(fullPath);
          }
          continue;
        }

        // Check if it's a component file
        if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
          if (hasSpaDirective(fullPath)) {
            // Extract component name from file
            const baseName = path.basename(entry.name, path.extname(entry.name));

            // Try to get the actual exported component name
            const componentName = getExportedComponentName(fullPath) || baseName;

            spaComponents.set(componentName, fullPath);
            console.log(`[spaDirective] Discovered SPA component: ${componentName} → ${fullPath}`);
          }
        }
      }
    } catch (e) {
      console.warn(`[spaDirective] Failed to scan directory: ${dir}`, e);
    }
  }

  // Scan each included directory
  for (const dir of include) {
    const fullDir = path.resolve(rootDir, dir);
    scanDirectory(fullDir);
  }

  return spaComponents;
}

/**
 * Initialize SPA component registry at server startup
 */
export function initializeSpaComponentRegistry(
  rootDir?: string,
  options?: {
    include?: string[];
    exclude?: string[];
  }
): Map<string, string> {
  const workingDir = rootDir || process.cwd();
  console.log('[spaDirective] Scanning for "use spa" components...');
  const discovered = discoverSpaComponents(workingDir, options);
  console.log(`[spaDirective] Found ${discovered.size} SPA component(s)`);
  return discovered;
}
