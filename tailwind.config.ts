import type { Config } from "tailwindcss";

// Theme: "Night tea garden". Deep Sylhet-hill green, Free Fire ember orange, tea-leaf lime, gold for prizes.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#061512",
        panel: "#0b221c",
        field: "#071915",
        line: "#1b3d35",
        brand: "#ff7a29",
        brand2: "#ffc83d",
        leaf: "#9be564",
        // neutrals tinted green so text and borders sit naturally on the new background
        zinc: {
          50: "#f3faf6",
          100: "#e8f3ed",
          200: "#d3e5db",
          300: "#b9d0c4",
          400: "#8ea99c",
          500: "#6a877a",
          600: "#4d695d",
          700: "#34493f",
          800: "#1f3229",
          900: "#14221d",
        },
      },
      fontFamily: {
        sans: ["Figtree", "Hind Siliguri", "system-ui", "sans-serif"],
        display: ["Big Shoulders Display", "Hind Siliguri", "Impact", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
