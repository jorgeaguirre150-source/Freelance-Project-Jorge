import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#0A1A2F", teal: "#16C2C2", cyan: "#22D3EE" },
    },
  },
  plugins: [],
};
export default config;
