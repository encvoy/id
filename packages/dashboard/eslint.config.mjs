// packages/dashboard/eslint.config.mjs
import js from "@eslint/js";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import cssModules from "eslint-plugin-css-modules";
import globals from "globals";

export default [
  // Default rules JavaScript
  js.configs.recommended,

  // TypeScript + React
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser, // change env.browser = true
        ...globals.es2021,
      },
    },
    ignores: ["vite.config.ts", "dist/", "node_modules/", ".vite/", "*.d.ts"],
    plugins: {
      "@typescript-eslint": ts,
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      ...ts.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Custom
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/exhaustive-deps": "off",
      "react/no-children-prop": "off",
      "@typescript-eslint/no-empty-function": "off",
      "react/react-in-jsx-scope": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
    settings: {
      react: {
        version: "detect", // auth set react version
        jsxRuntime: "automatic",
      },
    },
  },

  // CSS Modules
  {
    files: ["**/*.css"],
    plugins: { "css-modules": cssModules },
    rules: {
      "css-modules/no-undef-class": "error",
      "css-modules/no-unused-class": "warn",
    },
    settings: {
      "css-modules": {
        basePath: "./src",
        camelCase: true,
        extensions: [".module.css"],
      },
    },
  },
];
