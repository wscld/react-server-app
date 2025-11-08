import React from "react";
import { renderToString } from "react-dom/server";
import { resolveWithContext } from "./responseUtils";

export interface PageElement {
  type: any;
  props: {
    children?: React.ReactNode;
    spa?: boolean;
    title?: string | ((ctx: any) => string);
    meta?: Array<{ name?: string; property?: string; content: string }> | ((ctx: any) => Array<{ name?: string; property?: string; content: string }>);
    links?: Array<{ rel: string; href: string; [key: string]: string }> | ((ctx: any) => Array<{ rel: string; href: string; [key: string]: string }>);
    scripts?:
      | Array<{ src?: string; content?: string; async?: boolean; defer?: boolean; type?: string }>
      | ((ctx: any) => Array<{ src?: string; content?: string; async?: boolean; defer?: boolean; type?: string }>);
    styles?: string | ((ctx: any) => string);
    status?: number | ((ctx: any) => number);
    headers?: Record<string, string> | ((ctx: any) => Record<string, string>);
    lang?: string;
    doctype?: string;
    htmlAttributes?: Record<string, string>;
    bodyAttributes?: Record<string, string>;
    rootId?: string;
  };
}

/**
 * Check if a value is a Page element
 */
export function isPageElement(val: any): val is PageElement {
  return React.isValidElement(val) && (val.type as any)?.displayName === "Page";
}

/**
 * Render a Page element to HTML string
 */
export function renderPageToHtml(pageElement: PageElement, ctx: any): string {
  const props = pageElement.props;

  // Resolve all props with context
  const title = resolveWithContext(props.title ?? "React App", ctx);
  const meta = resolveWithContext(props.meta ?? [], ctx);
  const links = resolveWithContext(props.links ?? [], ctx);
  const scripts = resolveWithContext(props.scripts ?? [], ctx);
  const styles = resolveWithContext(props.styles ?? "", ctx);
  const lang = props.lang ?? "en";
  const doctype = props.doctype ?? "<!DOCTYPE html>";
  const htmlAttributes = props.htmlAttributes ?? {};
  const bodyAttributes = props.bodyAttributes ?? {};
  const rootId = props.rootId ?? "root";

  // Render the React content to static HTML
  let contentHtml = "";
  if (props.children) {
    try {
      contentHtml = renderToString(props.children as React.ReactElement);
    } catch (error) {
      console.error("Error rendering React content:", error);
      contentHtml = `<div>Error rendering content: ${error instanceof Error ? error.message : String(error)}</div>`;
    }
  }

  // Build HTML attributes string
  const htmlAttrsString = Object.entries(htmlAttributes)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(" ");

  // Build body attributes string
  const bodyAttrsString = Object.entries(bodyAttributes)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(" ");

  // Build meta tags
  const metaTags = meta
    .map((m: any) => {
      if (m.property) {
        return `<meta property="${escapeHtml(m.property)}" content="${escapeHtml(m.content)}">`;
      }
      return `<meta name="${escapeHtml(m.name || "")}" content="${escapeHtml(m.content)}">`;
    })
    .join("\n    ");

  // Build link tags
  const linkTags = links
    .map((link: any) => {
      const attrs = Object.entries(link)
        .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
        .join(" ");
      return `<link ${attrs}>`;
    })
    .join("\n    ");

  // Build script tags
  const scriptTags = scripts
    .map((script: any) => {
      const attrs: string[] = [];
      if (script.src) attrs.push(`src="${escapeHtml(script.src)}"`);
      if (script.async) attrs.push("async");
      if (script.defer) attrs.push("defer");
      if (script.type) attrs.push(`type="${escapeHtml(script.type)}"`);

      const attrsString = attrs.join(" ");
      const content = script.content || "";

      return `<script ${attrsString}>${content}</script>`;
    })
    .join("\n    ");

  // Build the complete HTML document
  const html = `${doctype}
<html lang="${escapeHtml(lang)}"${htmlAttrsString ? " " + htmlAttrsString : ""}>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>${metaTags ? "\n    " + metaTags : ""}${linkTags ? "\n    " + linkTags : ""}${
    styles ? `\n    <style>${styles}</style>` : ""
  }${scriptTags ? "\n    " + scriptTags : ""}
  </head>
  <body${bodyAttrsString ? " " + bodyAttrsString : ""}>
    <div id="${escapeHtml(rootId)}">${contentHtml}</div>
  </body>
</html>`;

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
