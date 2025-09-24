/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  define: {
    'process.env': {},
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'framer-motion'],
    exclude: ['@tensorflow/tfjs', '@tensorflow/tfjs-backend-webgl', '@tensorflow/tfjs-backend-cpu'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'TRVL Social',
        short_name: 'TRVL Social',
        description: 'Connect, travel, and explore with like-minded adventurers',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-192-maskable.png',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'maskable'
          },
          {
            src: 'https://vhecnqaejsukulaktjob.supabase.co/storage/v1/object/public/images/5Ccompany_logo_sm.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'maskable'
          }
        ],
        categories: ['travel', 'social', 'lifestyle'],
        shortcuts: [
          {
            name: 'Find Adventures',
            url: '/adventures',
            description: 'Browse available trips and adventures'
          },
          {
            name: 'My Groups',
            url: '/groups',
            description: 'View your travel groups'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5000000, // 5MB limit for large vendor chunks
        runtimeCaching: [
          // API caching with network-first strategy
          {
            urlPattern: /^https:\/\/api\.trvl-social\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: parseInt(process.env.API_CACHE_TTL || '300') // 5 minutes default
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          // Supabase API caching
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 300
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10
            }
          },
          // CDN assets caching
          {
            urlPattern: new RegExp(`^${process.env.CDN_BASE_URL || 'https://cdn.trvlsocial.com'}/.*`),
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-assets',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: parseInt(process.env.STATIC_CACHE_TTL || '604800') // 7 days default
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Image caching with longer TTL
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: parseInt(process.env.IMAGE_CACHE_TTL || '2592000') // 30 days default
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Font caching with very long TTL
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 15,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Static assets (JS, CSS) with stale-while-revalidate
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: parseInt(process.env.STATIC_CACHE_TTL || '604800') // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // External APIs (Mapbox, etc.)
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mapbox-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 3600 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 5
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    }),
    // Bundle analyzer for optimization
    process.env.ANALYZE && visualizer({
      filename: 'dist/bundle-analysis.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    }),
    // Only upload source maps in production builds
    process.env.NODE_ENV === 'production' && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      release: {
        name: process.env.npm_package_version || 'unknown',
        uploadLegacySourcemaps: {
          paths: ['./dist'],
          ignore: ['node_modules']
        }
      },
      sourcemaps: {
        assets: './dist/**'
      },
      // Automatically create releases and deploy notifications
      setCommits: {
        auto: true
      }
    })
  ].filter(Boolean),
  build: {
    // Generate source maps for Sentry
    sourcemap: true,
    // Set chunk size warning limit to 500KB
    chunkSizeWarningLimit: 500,
    // Production optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
        pure_funcs: process.env.NODE_ENV === 'production' ? ['console.log', 'console.debug'] : []
      }
    },
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB
    cssCodeSplit: true,
    // Tree shaking optimization
    target: 'es2020',
    // Improve tree shaking for libraries
    treeshaking: {
      moduleSideEffects: false,
      propertyReadSideEffects: false
    },
    // CDN configuration for production
    ...(process.env.NODE_ENV === 'production' && process.env.CDN_BASE_URL && {
      base: `${process.env.CDN_BASE_URL}/static/`
    }),
    rollupOptions: {
      external: (id) => {
        // Don't bundle development dependencies
        if (id.includes('storybook') || id.includes('vitest')) {
          return true;
        }
        return false;
      },
      output: {
        manualChunks: (id) => {
          // TensorFlow.js - separate into its own chunk for lazy loading
          if (id.includes('@tensorflow/tfjs') || id.includes('tensorflow')) {
            return 'tensorflow';
          }

          // Mapbox - keep separate for potential lazy loading
          if (id.includes('mapbox-gl')) {
            return 'mapbox';
          }

          // CRITICAL FIX: Bundle ALL UI components AND STORES with React to prevent initialization errors
          // This must come BEFORE the node_modules check to ensure proper bundling
          if (id.includes('src/components/ui/') ||
              id.includes('src/components/common/') ||
              id.includes('src/components/layout/') ||
              id.includes('src/components/adventure/') ||  // Added adventure components
              id.includes('src/components/wishlist/') ||   // Added wishlist components
              id.includes('src/stores/')) {                // CRITICAL: Bundle all stores with React
            return 'react-core';
          }

          // Large node_modules dependencies - split by category
          if (id.includes('node_modules')) {
            // Core React ecosystem - keep together for fast initial load
            // Include framer-motion, @react-spring, recharts, and zustand with React to avoid context issues
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') || id.includes('framer-motion') || id.includes('@react-spring') || id.includes('recharts') || id.includes('zustand')) {
              return 'react-core';
            }

            // Heavy analytics and monitoring libraries
            if (id.includes('@sentry') || id.includes('@datadog') || id.includes('mixpanel') || id.includes('analytics')) {
              return 'monitoring';
            }

            // AI/ML and NLP libraries (large computation libraries)
            if (id.includes('compromise') || id.includes('natural') || id.includes('sentiment') || id.includes('ml-') || id.includes('brain')) {
              return 'ai-nlp';
            }

            // Payment processing libraries
            if (id.includes('@stripe') || id.includes('stripe') || id.includes('payment')) {
              return 'payments';
            }

            // Rich text editor libraries
            if (id.includes('@tiptap') || id.includes('tiptap') || id.includes('prosemirror') || id.includes('codemirror')) {
              return 'editor';
            }

            // Chart and visualization libraries - recharts and its d3 dependencies need React
            if (id.includes('recharts') || id.includes('victory') || id.includes('d3')) {
              return 'react-core';
            }
            // Canvas libraries go to media-processing (already handled by html2canvas rule below)

            // Media and file processing (including all canvas libraries)
            if (id.includes('html2canvas') || id.includes('canvas') || id.includes('jspdf') || id.includes('image-') || id.includes('pdf-')) {
              return 'media-processing';
            }

            // Video and streaming
            if (id.includes('@daily-co') || id.includes('webrtc') || id.includes('stream') || id.includes('video')) {
              return 'video-streaming';
            }

            // Animation libraries (excluding framer-motion and @react-spring which are in react-core)
            if (id.includes('lottie')) {
              return 'animation';
            }

            // Form and validation libraries
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('yup') || id.includes('zod') || id.includes('formik')) {
              return 'forms';
            }

            // UI component libraries - MOVED TO REACT-CORE TO PREVENT INITIALIZATION ISSUES
            if (id.includes('@headlessui') || id.includes('@heroicons') || id.includes('lucide') || id.includes('@radix-ui')) {
              return 'react-core';  // Changed from 'ui-components' to 'react-core'
            }

            // Utility libraries
            if (id.includes('lodash') || id.includes('date-fns') || id.includes('uuid') || id.includes('clsx') || id.includes('classnames')) {
              return 'utils';
            }

            // Database and API libraries
            if (id.includes('@supabase') || id.includes('supabase') || id.includes('postgres') || id.includes('graphql')) {
              return 'database';
            }

            // Everything else
            return 'vendor-misc';
          }

          // Application code chunks - organize by feature for better caching
          // NOTE: UI components are already handled above before node_modules check

          // Admin features - split into logical groups
          if (id.includes('src/pages/admin/AdminDashboardPage')) {
            return 'admin-dashboard';
          }

          // Vendor features - split by functionality
          if (id.includes('src/pages/vendor/VendorDashboardPage')) {
            return 'vendor-dashboard';
          }
          if (id.includes('src/pages/vendor/PayoutManagementPage') || id.includes('src/pages/vendor/BidRequestsPage')) {
            return 'vendor-financial';
          }
          if (id.includes('src/pages/vendor/AdventureManagementPage')) {
            return 'vendor-adventures';
          }
          // Vendor components and admin components
          if (id.includes('src/components/vendor/') || id.includes('src/components/admin/')) {
            return 'vendor-components';
          }

          // Quiz and personality assessment - lazy load this heavy feature
          if (id.includes('src/pages/quiz/') || id.includes('src/components/quiz/') ||
              id.includes('assessment-service') || id.includes('personality-calculator') ||
              id.includes('ml/') || id.includes('compatibility-scoring')) {
            return 'quiz-ml';
          }

          // Search and filtering - excluding adventure components which are in react-core
          if (id.includes('src/pages/SearchPage') || (id.includes('search') && !id.includes('src/components/'))) {
            return 'search';
          }

          // Groups and recommendations
          if (id.includes('src/pages/groups/') || id.includes('recommendations') || id.includes('compatibility')) {
            return 'groups';
          }

          // Booking and payment flows
          if (id.includes('booking') || id.includes('payment') || id.includes('stripe')) {
            return 'booking';
          }

          // Community features
          if (id.includes('community') || id.includes('connections') || id.includes('social')) {
            return 'community';
          }

          // Adventure pages only (components are in react-core)
          if (id.includes('src/pages/adventures/')) {
            return 'adventures';
          }
        }
      }
    }
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
        // The plugin will run tests for the stories defined in your Storybook config
        // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
        storybookTest({
          configDir: path.join(dirname, '.storybook')
        })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [{
              browser: 'chromium'
            }]
          },
          setupFiles: ['.storybook/vitest.setup.js']
        }
      },
      {
        name: 'unit',
        test: {
          include: ['src/**/*.test.{js,jsx}'],
          environment: 'jsdom',
          globals: true,
        }
      }
    ]
  }
});