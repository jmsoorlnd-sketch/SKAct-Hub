import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "axios-vendor": ["axios"],
          "lucide-vendor": ["lucide-react"],

          // Feature chunks
          modals: ["./src/components/popforms/barangay/AddBarangay"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
