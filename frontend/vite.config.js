import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          reactVendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          icons: ["lucide-react"],
          axios: ["axios"],
        },
      },
    },
  },
});
