import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon-192.svg", "icons/icon-512.svg"],
      manifest: {
        name: "LM Verify - Legal Metrology Digital Certification",
        short_name: "LM Verify",
        description:
          "Unified online verification and digital certification system for weighing and measuring instruments under the Legal Metrology Act, 2009.",
        theme_color: "#0f766e",
        background_color: "#f8fafc",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
          { src: "icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});