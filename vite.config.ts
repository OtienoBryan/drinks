import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    port: 5173,
    strictPort: false,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    hmr: {
      overlay: true,
      port: 24678,
    },
    fs: {
      strict: false,
      allow: ['..'],
    },
  },

  plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@radix-ui/react-tooltip': path.resolve(__dirname, './src/stubs/radix-tooltip.tsx'),
    },
  },

  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.info'],
      },
    },
    sourcemap: false,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React runtime — loaded on every page
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Router — small, needed on every page
          if (id.includes('node_modules/react-router-dom') || id.includes('node_modules/react-router/')) {
            return 'vendor-router';
          }
          // React Query
          if (id.includes('@tanstack/react-query')) {
            return 'vendor-query';
          }
          // Radix UI primitives used on most pages
          if (
            id.includes('@radix-ui/react-dialog') ||
            id.includes('@radix-ui/react-dropdown-menu') ||
            id.includes('@radix-ui/react-toast') ||
            id.includes('@radix-ui/react-select') ||
            id.includes('@radix-ui/react-tabs')
          ) {
            return 'vendor-radix-core';
          }
          // Radix UI primitives rarely used
          if (id.includes('@radix-ui/')) {
            return 'vendor-radix-extra';
          }
          // Icons — used on most pages, separate chunk so it can be cached independently
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // Form utilities
          if (
            id.includes('react-hook-form') ||
            id.includes('zod') ||
            id.includes('@hookform')
          ) {
            return 'vendor-forms';
          }
          // Small utilities bundled together
          if (
            id.includes('clsx') ||
            id.includes('tailwind-merge') ||
            id.includes('class-variance-authority') ||
            id.includes('date-fns')
          ) {
            return 'vendor-utils';
          }
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || 'asset';
          if (/\.css$/.test(name)) return 'css/[name]-[hash].css';
          if (/\.(png|jpe?g|webp|svg|gif|ico)$/i.test(name)) return 'images/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },

  define: {
    global: 'globalThis',
  },

  esbuild: {
    jsx: 'automatic',
    // Remove console.* calls in production
    pure: mode === 'production' ? ['console.log', 'console.warn', 'console.info', 'console.debug'] : [],
  },
}));
