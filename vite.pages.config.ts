import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: path.resolve(import.meta.dirname, "static-site"),
  base: "./",
  publicDir: path.resolve(import.meta.dirname, "public"),
  plugins: [react()],
  build: {
    outDir: path.resolve(import.meta.dirname, "dist-pages"),
    emptyOutDir: true,
  },
});
