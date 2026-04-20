import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  root: ".",
  build: { outDir: "../dist/client" },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3100", changeOrigin: true },
      "/output": { target: "http://localhost:3100", changeOrigin: true },
    },
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
});
