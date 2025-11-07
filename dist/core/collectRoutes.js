import React from "react";
import { Route } from "../components/Route";
import { Controller } from "../components/Controller";
import { Middleware as MiddlewareComponent } from "../components/Middleware";
import { Guard as GuardComponent } from "../components/Guard";
/**
 * Recursively traverses a React element tree and collects route definitions
 *
 * @param element - The React element to traverse
 * @param basePath - The accumulated base path from parent Controllers
 * @param parentGuards - Guards from parent Controllers
 * @param parentMiddlewares - Middlewares from parent Controllers
 * @returns Array of collected routes with their full paths and handlers
 */
export function collectRoutes(element, basePath = "", parentGuards = [], parentMiddlewares = []) {
    if (!element) {
        return [];
    }
    const routes = [];
    // Handle Route component
    if (element.type === Route) {
        const props = element.props;
        const fullPath = joinPaths(basePath, props.path);
        const methods = Array.isArray(props.method) ? props.method : [props.method];
        // Combine parent guards/middlewares with route-specific ones
        const routeGuards = [...parentGuards, ...(props.guards || [])];
        const routeMiddlewares = [...parentMiddlewares, ...(props.middlewares || [])];
        for (const method of methods) {
            routes.push({
                path: fullPath,
                method: method,
                handler: props.onRequest,
                schema: props.schema,
                guards: routeGuards,
                middlewares: routeMiddlewares,
            });
        }
        return routes;
    }
    // Handle Controller component
    if (element.type === Controller) {
        const props = element.props;
        const newBasePath = joinPaths(basePath, props.path);
        // Combine parent guards/middlewares with controller-specific ones
        const controllerGuards = [...parentGuards, ...(props.guards || [])];
        const controllerMiddlewares = [...parentMiddlewares, ...(props.middlewares || [])];
        // Recursively collect routes from children
        const children = React.Children.toArray(props.children);
        for (const child of children) {
            if (React.isValidElement(child)) {
                routes.push(...collectRoutes(child, newBasePath, controllerGuards, controllerMiddlewares));
            }
        }
        return routes;
    }
    // Handle Middleware component
    if (element.type === MiddlewareComponent) {
        const props = element.props;
        const use = props.use;
        const middlewares = Array.isArray(use) ? use : [use];
        // Add these middlewares to the parent stack
        const newMiddlewares = [...parentMiddlewares, ...middlewares];
        // Recursively collect routes from children
        const children = React.Children.toArray(props.children);
        for (const child of children) {
            if (React.isValidElement(child)) {
                routes.push(...collectRoutes(child, basePath, parentGuards, newMiddlewares));
            }
        }
        return routes;
    }
    // Handle Guard component
    if (element.type === GuardComponent) {
        const props = element.props;
        const use = props.use;
        const guards = Array.isArray(use) ? use : [use];
        // Add these guards to the parent stack
        const newGuards = [...parentGuards, ...guards];
        // Recursively collect routes from children
        const children = React.Children.toArray(props.children);
        for (const child of children) {
            if (React.isValidElement(child)) {
                routes.push(...collectRoutes(child, basePath, newGuards, parentMiddlewares));
            }
        }
        return routes;
    }
    // Handle function components (like AuthController, UsersController, etc.)
    if (typeof element.type === "function" &&
        element.type !== Route &&
        element.type !== Controller &&
        element.type !== MiddlewareComponent &&
        element.type !== GuardComponent) {
        const props = element.props;
        const Component = element.type;
        // Check if it's a class component or function component
        let rendered;
        if (Component.prototype && Component.prototype.isReactComponent) {
            // Class component
            const instance = new Component(props);
            rendered = instance.render();
        }
        else {
            // Function component
            rendered = Component(props);
        }
        if (React.isValidElement(rendered)) {
            routes.push(...collectRoutes(rendered, basePath, parentGuards, parentMiddlewares));
        }
        return routes;
    }
    // Handle Fragment or other container components
    const props = element.props;
    if (props?.children) {
        const children = React.Children.toArray(props.children);
        for (const child of children) {
            if (React.isValidElement(child)) {
                routes.push(...collectRoutes(child, basePath, parentGuards, parentMiddlewares));
            }
        }
    }
    return routes;
}
/**
 * Joins path segments, ensuring no duplicate slashes
 */
function joinPaths(...paths) {
    return paths
        .filter(Boolean)
        .map((p) => p.replace(/^\/+|\/+$/g, ""))
        .filter(Boolean)
        .join("/")
        .replace(/^/, "/");
}
//# sourceMappingURL=collectRoutes.js.map