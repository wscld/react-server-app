import * as fs from "fs";
import { clearBundleCache } from "./bundler";

const watchedFiles = new Set<string>();
const fileWatchers = new Map<string, fs.FSWatcher>();

/**
 * Watch a component file for changes and clear cache when it changes
 */
export function watchComponentFile(filePath: string, onReload?: () => void): void {
  if (watchedFiles.has(filePath)) {
    return; // Already watching
  }

  watchedFiles.add(filePath);

  const watcher = fs.watch(filePath, (eventType) => {
    if (eventType === "change") {
      console.log(`[hotReload] File changed: ${filePath}`);
      clearBundleCache();
      onReload?.();
    }
  });

  fileWatchers.set(filePath, watcher);
}

/**
 * Stop watching all files
 */
export function stopWatching(): void {
  for (const watcher of fileWatchers.values()) {
    watcher.close();
  }
  fileWatchers.clear();
  watchedFiles.clear();
}
