import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false, // We'll generate types separately with tsc
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ["react", "react-dom", "fastify", "@fastify/static", "vite", "@vitejs/plugin-react"],
  esbuildOptions(options) {
    options.jsx = "transform";
    options.jsxFactory = "React.createElement";
    options.jsxFragment = "React.Fragment";
  },
});
