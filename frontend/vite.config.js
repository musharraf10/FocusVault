import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    proxy: {
      "/quote": {
        target: "https://api.quotable.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/quote/, "/random"),
      },
    },
  },
});
