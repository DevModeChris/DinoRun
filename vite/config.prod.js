import { defineConfig } from 'vite';

export default defineConfig({
    base: '/DinoRun/',
    logLevel: 'warning',
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
