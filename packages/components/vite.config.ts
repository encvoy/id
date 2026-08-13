import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const external = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "@emotion/react",
  "@emotion/styled",
  "@mui/material",
  "@mui/icons-material",
  "@mui/x-date-pickers",
  "date-fns",
  "libphonenumber-js",
  "react-hook-form",
  "react-phone-number-input",
];

export default defineConfig({
  plugins: [react()],
  build: {
    // Type declarations are emitted into the same directory by TypeScript.
    // Keep them when Vite rebuilds the JavaScript bundle in watch mode.
    emptyOutDir: false,
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        theme: resolve(__dirname, "src/theme/index.ts"),
      },
      formats: ["es"],
      cssFileName: "styles",
    },
    rollupOptions: {
      external: (id) => external.some((dependency) => id === dependency || id.startsWith(`${dependency}/`)),
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: (assetInfo) =>
          assetInfo.names?.includes("styles.css")
            ? "styles.css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
});
