import React from 'react';
import type { RouteProps } from '../types';

/**
 * Route component - defines a single API endpoint
 * 
 * @example
 * <Route
 *   path="/users/:id"
 *   method="GET"
 *   onRequest={({ params }) => ({ id: params.id })}
 * />
 */
export function Route<TParams = any, TQuery = any, TBody = any, TResponse = any>(
    props: RouteProps<TParams, TQuery, TBody, TResponse>
): null {
    // This component is never rendered - it's only used for configuration
    return null;
}

Route.displayName = 'Route';
