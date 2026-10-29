import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // The public site reproduces the original theme exactly: it needs plain <a>
    // links (the theme handles page transitions), its jQuery scripts loaded in
    // order in <head>, its own stylesheets and plain <img> tags.
    files: ["src/app/(site)/**", "src/components/site/**"],
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "@next/next/no-sync-scripts": "off",
      "@next/next/no-css-tags": "off",
      "@next/next/no-img-element": "off",
      "@next/next/next-script-for-ga": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
