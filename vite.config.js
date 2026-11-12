import { defineConfig } from 'vite';
import { resolve } from 'path';
import { ViteEjsPlugin } from 'vite-plugin-ejs';

export default defineConfig({
  plugins: [
    ViteEjsPlugin(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        tools: resolve(__dirname, 'tools.html'),
        toolDetails: resolve(__dirname, 'tool-details.html'),
        about: resolve(__dirname, 'about.html'),
      },
    },
  },
});
