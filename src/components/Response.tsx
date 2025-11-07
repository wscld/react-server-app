import React from 'react';

/**
 * Response component - used as a declarative response returned from route handlers
 *
 * Props can be concrete values or functions that receive the current request context
 * (request, reply, params, query, body).
 */
export function Response(props: {
    json?: any | ((ctx: any) => any);
    status?: number | ((ctx: any) => number);
    headers?: Record<string, string> | ((ctx: any) => Record<string, string>);
    raw?: any; // allow sending raw reply if needed
}): null {
    // This component is not rendered; it's inspected by the server at runtime
    return null;
}

Response.displayName = 'Response';

export default Response;
