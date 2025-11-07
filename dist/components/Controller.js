import React from 'react';
/**
 * Controller component - groups routes under a common path prefix
 *
 * @example
 * <Controller path="/api">
 *   <Route path="/users" method="GET" onRequest={() => []} />
 * </Controller>
 */
export function Controller(props) {
    return React.createElement(React.Fragment, null, props.children);
}
Controller.displayName = 'Controller';
//# sourceMappingURL=Controller.js.map