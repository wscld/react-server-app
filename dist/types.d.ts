import React from "react";
import { FastifyRequest, FastifyReply } from "fastify";
export type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD";
export interface RouteContext<TParams = any, TQuery = any, TBody = any> {
    request: FastifyRequest;
    reply: FastifyReply;
    params: TParams;
    query: TQuery;
    body: TBody;
}
export interface RouteHandler<TParams = any, TQuery = any, TBody = any, TResponse = any> {
    (context: RouteContext<TParams, TQuery, TBody>): TResponse | Promise<TResponse>;
}
export interface Middleware<TParams = any, TQuery = any, TBody = any> {
    (context: RouteContext<TParams, TQuery, TBody>, next: () => Promise<void>): Promise<void> | void;
}
export interface Guard<TParams = any, TQuery = any, TBody = any> {
    (context: RouteContext<TParams, TQuery, TBody>): boolean | Promise<boolean>;
}
export interface RouteProps<TParams = any, TQuery = any, TBody = any, TResponse = any> {
    path: string;
    method: HTTPMethod | HTTPMethod[];
    onRequest: RouteHandler<TParams, TQuery, TBody, TResponse>;
    schema?: any;
    guards?: Guard[];
    middlewares?: Middleware[];
    children?: never;
}
export interface ControllerProps {
    path: string;
    guards?: Guard[];
    middlewares?: Middleware[];
    children: React.ReactNode;
}
export interface AppProps {
    port?: number;
    host?: string;
    staticDir?: string;
    staticPrefix?: string;
    children: React.ReactNode;
}
export interface CollectedRoute {
    path: string;
    method: HTTPMethod;
    handler: RouteHandler;
    schema?: any;
    guards: Guard[];
    middlewares: Middleware[];
}
//# sourceMappingURL=types.d.ts.map