import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#08080c",
        panel: "#13131a",
        line: "#25252f",
        brand: "#ff4d1a",
        brand2: "#ffb020",
      },
      fontFamily: {
        sans: ["Inter", "Hind Siliguri", "system-ui", "sans-serif"],
        display: ["Rajdhani", "Hind Siliguri", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
