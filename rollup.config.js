import replace from "@rollup/plugin-replace";

export default {
  input: "./scripts/index.js",
  output: {
    file: "index.js",
    format: "iife",
  },
  plugins: [
    replace({
      preventAssignment: true,
      "process.env.GAME_TYPE": JSON.stringify(process.env.GAME_TYPE || "order"),
    }),
  ],
};
