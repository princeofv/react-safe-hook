import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";

/** @type {import('rollup').RollupOptions[]} */
export default [
  // Main bundle (ESM + CJS)
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.esm.js",
        format: "esm",
        sourcemap: true,
      },
      {
        file: "dist/index.cjs.js",
        format: "cjs",
        sourcemap: true,
      },
    ],
    external: ["react"],
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        declaration: false, // We'll generate declarations separately
      }),
    ],
  },
  // Type declarations
  {
    input: "src/index.ts",
    output: {
      file: "dist/index.d.ts",
      format: "esm",
    },
    external: ["react"],
    plugins: [dts()],
  },
];
