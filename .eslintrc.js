module.exports = {
  env: {
    commonjs: true,
    es2020: true,
    node: true
  },
  extends: ["airbnb-base"],
  parserOptions: {
    ecmaVersion: 11
  },
  rules: {
    quotes: ["error", "double"],
    "comma-dangle": ["error", "never"],
    camelcase: "off",
    "arrow-body-style": "off",
    "no-restricted-syntax": "off"
  }
};
