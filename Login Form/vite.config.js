/// vite.config.js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom', // Ensures a browser-like environment
        server: {
            port: 5000
        }
    },

    server: {
        hmr: {
            host: "localhost",
        },
    },
    build: {
        sourcemap: false, // Disable source maps
    }
});
