import React from "react";
export interface PageElement {
    type: any;
    props: {
        children?: React.ReactNode;
        title?: string | ((ctx: any) => string);
        meta?: Array<{
            name?: string;
            property?: string;
            content: string;
        }> | ((ctx: any) => Array<{
            name?: string;
            property?: string;
            content: string;
        }>);
        links?: Array<{
            rel: string;
            href: string;
            [key: string]: string;
        }> | ((ctx: any) => Array<{
            rel: string;
            href: string;
            [key: string]: string;
        }>);
        scripts?: Array<{
            src?: string;
            content?: string;
            async?: boolean;
            defer?: boolean;
            type?: string;
        }> | ((ctx: any) => Array<{
            src?: string;
            content?: string;
            async?: boolean;
            defer?: boolean;
            type?: string;
        }>);
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
export declare function isPageElement(val: any): val is PageElement;
/**
 * Render a Page element to HTML string
 */
export declare function renderPageToHtml(pageElement: PageElement, ctx: any): string;
//# sourceMappingURL=pageUtils.d.ts.map