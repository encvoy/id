import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import checker from "vite-plugin-checker";
import eslint from "vite-plugin-eslint";

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      {
        name: "spa-fallback",
        apply: "serve",
        configureServer(server) {
          return () => {
            server.middlewares.use((req, res, next) => {
              if (
                req.url &&
                !req.url.startsWith("/api") &&
                !req.url.includes(".") &&
                req.headers.accept?.includes("text/html")
              ) {
                req.url = "/index.html";
              }
              next();
            });
          };
        },
      },
      viteTsconfigPaths(),
      checker({
        typescript: true,
      }),
      eslint(),
      svgr({
        svgrOptions: {
          exportType: "named",
          ref: true,
          svgo: false,
          titleProp: true,
        },
        include: "**/*.svg",
      }),
      // Plugin for replacing variables in HTML
      {
        name: "html-env-vars",
        transformIndexHtml(html) {
          return html.replace(/%(\w+)%/g, (match, varName) => {
            return process.env[varName] || match;
          });
        },
      },
    ],
    server: {
      host: "localhost",
      port: 3001,
      historyApiFallback: true,
      hmr: true,
      // HTTPS only for local development (when certificates are available)
      ...(() => {
        const keyPath = path.resolve(
          __dirname,
          "../../certs/local.encvoy.com-key.pem"
        );
        const certPath = path.resolve(
          __dirname,
          "../../certs/local.encvoy.com.pem"
        );

        // Use HTTPS if certificates are available (local development)
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
          return {
            https: {
              key: fs.readFileSync(keyPath),
              cert: fs.readFileSync(certPath),
            },
          };
        }
        return {};
      })(),
      // Settings for working with nginx proxy
      proxy: {
        // Redirect API requests to backend via nginx
        "/api": {
          target: "https://local.encvoy.com",
          changeOrigin: true,
          secure: true,
        },
        "/oidc": {
          target: "https://local.encvoy.com",
          changeOrigin: true,
          secure: true,
        },
        "/auth": {
          target: "https://local.encvoy.com",
          changeOrigin: true,
          secure: true,
        },
      },
    },
    // Base public path for production
    base: process.env.VITE_DOMAIN || "/",
    build: {
      // Settings for production build
      rollupOptions: {
        output: {
          // Add hash to filenames for cache busting
          entryFileNames: "assets/[name].[hash].js",
          chunkFileNames: "assets/[name].[hash].js",
          assetFileNames: "assets/[name].[hash].[ext]",
          manualChunks: {
            vendor: ["react", "react-dom"],
            ui: ["@mui/material", "@mui/icons-material"],
            utils: ["date-fns", "qrcode", "dompurify"],
          },
        },
      },
      // Ensure consistent file names for better caching
      chunkSizeWarningLimit: 1000,
    },
    // Settings for local preview
    preview: {
      port: 3001,
      ...(() => {
        const keyPath = path.resolve(
          __dirname,
          "../../certs/local.encvoy.com-key.pem"
        );
        const certPath = path.resolve(
          __dirname,
          "../../certs/local.encvoy.com.pem"
        );

        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
          return {
            https: {
              key: fs.readFileSync(keyPath),
              cert: fs.readFileSync(certPath),
            },
          };
        }
        return {};
      })(),
    },
    // Prebuild dependencies
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "@emotion/react",
        "@emotion/styled",
        "@mui/material",
        "react-is",
        "prop-types",
        "void-elements",
      ],
      force: true,
      esbuildOptions: {
        mainFields: ["module", "main"],
      },
    },
    resolve: {
      dedupe: ["react", "react-dom", "react-is", "prop-types"],
    },
  };
});
