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

// Middleware can modify the request/reply or call next()
export interface Middleware<TParams = any, TQuery = any, TBody = any> {
  (context: RouteContext<TParams, TQuery, TBody>, next: () => Promise<void>): Promise<void> | void;
}

// Guard returns true to allow, false to deny (or throws)
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
