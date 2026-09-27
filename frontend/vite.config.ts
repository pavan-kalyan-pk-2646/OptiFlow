import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // three.js + react-three-fiber is one lazily loaded chunk; keep it named and together.
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "three-vendor", test: /node_modules[\\/](three|@react-three|three-stdlib|troika|maath|camera-controls)/ },
          ],
        },
      },
    },
  },
});
