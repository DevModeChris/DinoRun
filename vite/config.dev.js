import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

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
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: './src/assets',
                    dest: './src/',
                },
            ],
        }),
    ],
});
