module.exports = {
  extends: ["eslint:recommended", "plugin:prettier/recommended"],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  },
  rules: {
    parser: "typescript",
    semi: true,
    trailingComma: "es5",
    singleQuote: true,
    printWidth: 80,
  },
};
