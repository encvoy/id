/* eslint-env node */
export default {
  extends: ["./.eslintrc.cjs"],
  plugins: ["css-modules"],
  rules: {
    "css-modules/no-undef-class": "error",
    "css-modules/no-unused-class": "warn",
    "css-modules/compose-type": "warn",
    "css-modules/no-unused-imports": "warn",
  },
  settings: {
    "css-modules": {
      basePath: "./src",
      camelCase: true,
      extensions: [".module.css", ".module.scss", ".module.sass"],
    },
  },
};
