import React from 'react';
/**
 * Middleware component - wraps routes/controllers to apply middleware
 *
 * @example
 * <Middleware use={[loggingMiddleware, corsMiddleware]}>
 *   <Route path="/users" method="GET" onRequest={...} />
 * </Middleware>
 */
export function Middleware(props) {
    return React.createElement(React.Fragment, null, props.children);
}
Middleware.displayName = 'Middleware';
//# sourceMappingURL=Middleware.js.map