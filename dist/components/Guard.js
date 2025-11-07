import React from 'react';
/**
 * Guard component - wraps routes/controllers to apply guards
 *
 * @example
 * <Guard use={[authGuard, adminGuard]}>
 *   <Route path="/admin" method="GET" onRequest={...} />
 * </Guard>
 */
export function Guard(props) {
    return React.createElement(React.Fragment, null, props.children);
}
Guard.displayName = 'Guard';
//# sourceMappingURL=Guard.js.map