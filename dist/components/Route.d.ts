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
export declare function Route<TParams = any, TQuery = any, TBody = any, TResponse = any>(props: RouteProps<TParams, TQuery, TBody, TResponse>): null;
export declare namespace Route {
    var displayName: string;
}
//# sourceMappingURL=Route.d.ts.map