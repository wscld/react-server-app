import React from 'react';
import type { Guard as GuardFunction } from '../types';

export interface GuardProps {
    use: GuardFunction | GuardFunction[];
    children: React.ReactNode;
}

/**
 * Guard component - wraps routes/controllers to apply guards
 * 
 * @example
 * <Guard use={[authGuard, adminGuard]}>
 *   <Route path="/admin" method="GET" onRequest={...} />
 * </Guard>
 */
export function Guard(props: GuardProps): React.ReactElement {
    return React.createElement(React.Fragment, null, props.children);
}

Guard.displayName = 'Guard';
