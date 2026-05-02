import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 18px 80px rgba(20, 184, 166, 0.18)"
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.45", transform: "scale(0.96)" },
          "50%": { opacity: "1", transform: "scale(1.04)" }
        },
        drift: {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -10px, 0)" }
        }
      },
      animation: {
        breathe: "breathe 1.2s ease-in-out infinite",
        drift: "drift 7s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
