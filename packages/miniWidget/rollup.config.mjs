import fs from "fs";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import path from "path";
import del from "rollup-plugin-delete";
import { dts } from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dashboardCompilerOptions = {
  baseUrl: ".",
  paths: {
    "~/*": ["../dashboard/src/packages/authWidget/*"],
    "src/*": ["../dashboard/src/*"],
  },
};
const dashboardSourceInclude = [
  "src/**/*.ts",
  "src/**/*.tsx",
  "../dashboard/src/**/*.ts",
  "../dashboard/src/**/*.tsx",
];
const aliasExtensions = [".ts", ".tsx", ".js", ".jsx", ".json"];

const resolveAliasTarget = (targetPath) => {
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return targetPath;
  }

  for (const extension of aliasExtensions) {
    const filePath = `${targetPath}${extension}`;
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
  }

  for (const extension of aliasExtensions) {
    const indexPath = path.join(targetPath, `index${extension}`);
    if (fs.existsSync(indexPath) && fs.statSync(indexPath).isFile()) {
      return indexPath;
    }
  }

  return null;
};

const resolveDashboardAlias = (id) => {
  for (const [pattern, targets] of Object.entries(dashboardCompilerOptions.paths)) {
    const prefix = pattern.replace("*", "");
    if (!id.startsWith(prefix)) {
      continue;
    }

    const suffix = id.slice(prefix.length);
    for (const targetPattern of targets) {
      const aliasedPath = targetPattern.replace("*", suffix);
      const resolvedPath = resolveAliasTarget(path.resolve(__dirname, aliasedPath));
      if (resolvedPath) {
        return resolvedPath;
      }
    }
  }

  return null;
};

const dashboardAliasPlugin = {
  name: "dashboard-alias",
  resolveId(id) {
    return resolveDashboardAlias(id);
  },
};

const processPolyfill = {
  name: "process-polyfill",
  resolveId(id) {
    if (id === "process") {
      return id;
    }
    return null;
  },
  load(id) {
    if (id === "process") {
      return `
        export default {
          env: {
            NODE_ENV: "${process.env.NODE_ENV || "production"}"
          }
        };
      `;
    }
    return null;
  },
  transform(code, id) {
    if (id.includes("node_modules")) {
      return code.replace(
        /process\.env\.NODE_ENV/g,
        `"${process.env.NODE_ENV || "production"}"`,
      );
    }
    return null;
  },
};

const jsConfig = {
  input: "../dashboard/src/packages/authWidget/index.ts",
  external: [
    "react",
    "react-dom",
    "@mui/material",
    "@mui/icons-material",
    "@emotion/react",
    "@emotion/styled",
  ],
  output: [
    {
      file: "dist/index.js",
      format: "cjs",
      sourcemap: true,
      exports: "named",
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
      exports: "named",
    },
  ],
  plugins: [
    json(),
    del({
      targets: "dist/*",
      runOnce: !!process.env.ROLLUP_WATCH,
      force: true,
    }),
    peerDepsExternal(),
    dashboardAliasPlugin,
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    {
      name: "debug-css-imports",
      resolveId(id, importer) {
        if (id.includes(".css")) {
          console.log("🎨 CSS resolveId:", id, "from:", importer);
        }
        return null;
      },
      load(id) {
        if (id.includes(".css")) {
          console.log("🎨 CSS load:", id);
        }
        return null;
      },
    },
    postcss({
      modules: {
        generateScopedName: "[name]__[local]__[hash:base64:5]",
      },
      extract: false,
      inject: true,
      minimize: true,
      sourceMap: false,
      include: [
        "**/*.css",
        "**/*.module.css",
        "../dashboard/src/packages/authWidget/**/*.css",
        "../dashboard/src/packages/authWidget/**/*.module.css",
      ],
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      compilerOptions: dashboardCompilerOptions,
      declaration: false,
      noEmitOnError: true,
      include: dashboardSourceInclude,
      exclude: ["node_modules/**", "dist/**"],
    }),
    !process.env.ROLLUP_WATCH &&
      process.env.NODE_ENV === "production" &&
      terser(),
  ].filter(Boolean),
};

const typesConfig = {
  input: "../dashboard/src/packages/authWidget/index.ts",
  output: {
    file: "dist/index.d.ts",
    format: "esm",
  },
  plugins: [
    dts({
      compilerOptions: dashboardCompilerOptions,
    }),
  ],
  external: [
    "react",
    "react-dom",
    "@mui/material",
    "@mui/icons-material",
    "@emotion/react",
    "@emotion/styled",
    /\.css$/,
    /\.module\.css$/,
  ],
};

const umdConfig = {
  input: "src/widget-umd.ts",
  output: {
    file: path.resolve(__dirname, "../backend/auth/widget-umd.js"),
    format: "umd",
    name: "Widget",
    sourcemap: true,
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react-dom/client": "ReactDOM",
      "@mui/material": "MaterialUI",
      "@mui/icons-material": "MaterialUIIcons",
      "@emotion/react": "EmotionReact",
      "@emotion/styled": "EmotionStyled",
    },
  },
  plugins: [
    json(),
    del({
      targets: "../backend/auth/*",
      runOnce: !!process.env.ROLLUP_WATCH,
      force: true,
    }),
    processPolyfill,
    dashboardAliasPlugin,
    resolve({
      browser: true,
      preferBuiltins: false,
      dedupe: ["react", "react-dom", "react-dom/client"],
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      compilerOptions: dashboardCompilerOptions,
      declaration: false,
      include: dashboardSourceInclude,
      exclude: ["node_modules/**", "dist/**", "build/**"],
    }),
    postcss({
      modules: {
        generateScopedName: "[name]__[local]__[hash:base64:5]",
      },
      extract: false,
      inject: true,
      minimize: !process.env.ROLLUP_WATCH,
      sourceMap: true,
      include: [
        "**/*.css",
        "**/*.module.css",
        "../dashboard/src/packages/authWidget/**/*.css",
        "../dashboard/src/packages/authWidget/**/*.module.css",
      ],
    }),
    !process.env.ROLLUP_WATCH &&
      process.env.NODE_ENV === "production" &&
      terser(),
  ].filter(Boolean),
};

const buildType = process.env.BUILD_TYPE || "all";

export default buildType === "umd"
  ? [umdConfig]
  : buildType === "cjs-esm-types"
    ? [jsConfig, typesConfig]
    : [jsConfig, typesConfig, umdConfig];
