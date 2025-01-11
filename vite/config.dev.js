import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    server: {
        port: 8000,
        host: true,
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser'],
                },
            },
        },
    },
});
