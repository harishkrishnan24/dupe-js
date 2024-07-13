import cleanup from "rollup-plugin-cleanup";
import filesize from "rollup-plugin-filesize";

export default {
  input: "src/index.js",
  output: {
    file: "dist/dupe-js.js",
    format: "esm",
    plugins: [filesize()],
  },
  plugins: [cleanup()],
};
