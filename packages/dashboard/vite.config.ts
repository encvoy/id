import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import checker from "vite-plugin-checker";
import eslint from "vite-plugin-eslint";

const URL_SCHEME_PATTERN = /^[A-Za-z][A-Za-z0-9+.-]*:\/\//;

const stripOptionalQuotes = (value: string) => value.replace(/^(['"])(.*)\1$/, "$2");

const resolveRuntimeDomain = () => {
  const idHost = stripOptionalQuotes((process.env.ID_HOST || "").trim());
  const configuredBasePath = stripOptionalQuotes(
    (process.env.ID_BASE_PATH || "").trim()
  );
  const basePath =
    configuredBasePath && configuredBasePath !== "/"
      ? `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`
      : "";
  let domain = stripOptionalQuotes(
    (
      process.env.DOMAIN ||
      process.env.VITE_DOMAIN ||
      `${idHost.replace(/\/+$/, "")}${basePath}`
    ).trim()
  ).replace(/\/+$/, "");

  if (domain && !URL_SCHEME_PATTERN.test(domain)) {
    domain = `https://${domain}`;
  }

  return domain;
};

export default defineConfig(() => {
  const runtimeDomain = resolveRuntimeDomain();
  const localProxyTarget = runtimeDomain || "https://local.trusted.plus/id";

  return {
    // Production bundles stay mount-point agnostic. Local prefixes are passed
    // explicitly with Vite's `--base` CLI option by the root dev scripts.
    base: "./",
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
    ],
    server: {
      host: "127.0.0.1",
      port: 3001,
      historyApiFallback: true,
      hmr: true,
      // HTTPS only for local development (when certificates are available)
      ...(() => {
        const keyPath = path.resolve(
          __dirname,
          "../../certs/local.trusted.plus-key.pem"
        );
        const certPath = path.resolve(
          __dirname,
          "../../certs/local.trusted.plus.pem"
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
          target: localProxyTarget,
          changeOrigin: true,
          secure: true,
        },
        "/oidc": {
          target: localProxyTarget,
          changeOrigin: true,
          secure: true,
        },
        "/auth": {
          target: localProxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    resolve: {
      preserveSymlinks: true,
      alias: {
        react: path.resolve(__dirname, "node_modules/react"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react-hook-form",
        "@emotion/react",
        "@emotion/styled",
        "@mui/material",
        "@mui/icons-material",
      ],
    },
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
          "../../certs/local.trusted.plus-key.pem"
        );
        const certPath = path.resolve(
          __dirname,
          "../../certs/local.trusted.plus.pem"
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
      // @encvoy-id/components is a linked local package whose public exports change
      // as its dist is rebuilt. Recreate the prebundle on every Dashboard start
      // so Vite cannot serve an older export surface.
      force: true,
      include: [
        "react",
        "react-dom",
        "@emotion/react",
        "@emotion/styled",
        "@mui/material",
      ],
    },
  };
});
