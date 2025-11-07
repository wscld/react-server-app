import React from "react";
import type { CollectedRoute, Guard, Middleware } from "../types";
/**
 * Recursively traverses a React element tree and collects route definitions
 *
 * @param element - The React element to traverse
 * @param basePath - The accumulated base path from parent Controllers
 * @param parentGuards - Guards from parent Controllers
 * @param parentMiddlewares - Middlewares from parent Controllers
 * @returns Array of collected routes with their full paths and handlers
 */
export declare function collectRoutes(element: React.ReactElement | null, basePath?: string, parentGuards?: Guard[], parentMiddlewares?: Middleware[]): CollectedRoute[];
//# sourceMappingURL=collectRoutes.d.ts.map