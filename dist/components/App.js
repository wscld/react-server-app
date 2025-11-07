import React from 'react';
/**
 * App component - root component that starts the Fastify server
 *
 * @example
 * <App port={8080}>
 *   <Controller path="/api">
 *     <Route path="/hello" method="GET" onRequest={() => ({ message: 'Hello' })} />
 *   </Controller>
 * </App>
 */
export function App(props) {
    return React.createElement(React.Fragment, null, props.children);
}
App.displayName = 'App';
//# sourceMappingURL=App.js.map