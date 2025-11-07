import React from 'react';
import type { Middleware as MiddlewareFunction } from '../types';

export interface MiddlewareProps {
    use: MiddlewareFunction | MiddlewareFunction[];
    children: React.ReactNode;
}

/**
 * Middleware component - wraps routes/controllers to apply middleware
 * 
 * @example
 * <Middleware use={[loggingMiddleware, corsMiddleware]}>
 *   <Route path="/users" method="GET" onRequest={...} />
 * </Middleware>
 */
export function Middleware(props: MiddlewareProps): React.ReactElement {
    return React.createElement(React.Fragment, null, props.children);
}

Middleware.displayName = 'Middleware';
