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
export declare function Guard(props: GuardProps): React.ReactElement;
export declare namespace Guard {
    var displayName: string;
}
//# sourceMappingURL=Guard.d.ts.map