import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Dev proxy: the browser talks to http://localhost:5173/api/... and Vite forwards
 * it to the Spring Boot API. This keeps the backend CORS configuration unchanged
 * (CORS_ALLOWED_ORIGINS only lists the old frontend origins).
 */
function apiProxy(target) {
  return {
    '/api': {
      target,
      changeOrigin: true,
      // The browser request is same-origin with Vite, so the proxy should
      // forward it like a server-side reverse proxy: without the browser
      // Origin header that Spring's CORS filter would reject.
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyRequest) => proxyRequest.removeHeader('origin'));
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET || 'http://localhost:8080';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: apiProxy(proxyTarget),
    },
    preview: {
      port: 4173,
      strictPort: true,
      // Used only by the local production-preview smoke test.
      proxy: apiProxy(proxyTarget),
    },
  };
});
