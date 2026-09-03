import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // three.js alone is ~510 kB minified; it gets its own long-cached chunk and the limit covers it.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: { three: ['three'] },
      },
    },
  },
});
