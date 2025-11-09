import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true, // Generate .d.ts files with tsup (faster than tsc)
  sourcemap: true,
  clean: true,
  splitting: true, // Enable code splitting for better tree-shaking
  treeshake: true,
  minify: false, // Don't minify - it's a library, let users decide
  target: "es2022",
  external: ["react", "react-dom", "fastify", "@fastify/static", "vite", "@vitejs/plugin-react", "esbuild"],
  esbuildOptions(options) {
    options.jsx = "transform";
    options.jsxFactory = "React.createElement";
    options.jsxFragment = "React.Fragment";
  },
  // Only bundle what's needed, mark Node.js built-ins as external
  noExternal: [],
});
