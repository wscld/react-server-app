import React from "react";

// Resolve a value that may be a function(ctx) or a plain value. Works recursively for objects/arrays.
export function resolveWithContext(value: any, ctx: any): any {
  if (typeof value === "function") {
    try {
      return value(ctx);
    } catch (err) {
      // if function expects no args and throws, propagate
      throw err;
    }
  }

  if (Array.isArray(value)) {
    return value.map((v) => resolveWithContext(v, ctx));
  }

  if (value && typeof value === "object") {
    const out: any = {};
    for (const key of Object.keys(value)) {
      out[key] = resolveWithContext(value[key], ctx);
    }
    return out;
  }

  return value;
}

// Helper 'hook' that returns a function which extracts a key from the context.
export function useContext(key: string) {
  return (ctx: any) => ctx?.[key];
}

// Convenience: helper to get header value from ctx
export function getHeader(name: string) {
  return (ctx: any) => ctx?.request?.headers?.[name.toLowerCase()];
}

// Detect if something is a React element of our Response type
export function isResponseElement(val: any) {
  return React.isValidElement(val) && (val.type as any)?.displayName === "Response";
}
