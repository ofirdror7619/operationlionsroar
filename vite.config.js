import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // Phaser is a large runtime by design. Keep warnings meaningful for this project.
    chunkSizeWarningLimit: 1700,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"]
        }
      }
    }
  }
});
