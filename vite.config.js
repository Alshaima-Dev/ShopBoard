import { defineConfig } from 'vite'

// Keep the development URL consistent with the IDE launcher.
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    hmr: true,
  },
})
