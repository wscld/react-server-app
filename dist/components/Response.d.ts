/**
 * Response component - used as a declarative response returned from route handlers
 *
 * Props can be concrete values or functions that receive the current request context
 * (request, reply, params, query, body).
 */
export declare function Response(props: {
    json?: any | ((ctx: any) => any);
    status?: number | ((ctx: any) => number);
    headers?: Record<string, string> | ((ctx: any) => Record<string, string>);
    raw?: any;
}): null;
export declare namespace Response {
    var displayName: string;
}
export default Response;
//# sourceMappingURL=Response.d.ts.map