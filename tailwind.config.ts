import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#EEF1F5",
          100: "#D7DEE8",
          400: "#3E5573",
          600: "#1C3554",
          700: "#12294B",
          800: "#0D1F3B",
          900: "#0B1D38",
        },
        gold: {
          50: "#F8F2E4",
          100: "#EDDFB8",
          400: "#BA9744",
          500: "#A9822E",
          600: "#8C6B23",
        },
        ink: {
          900: "#101828",
          700: "#31394A",
          500: "#5B6572",
          300: "#8993A2",
        },
        line: {
          200: "#E4E8EE",
          300: "#DDE3EA",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F4F6F8",
        },
        status: {
          submitted: "#5B6572",
          received: "#1C5A8A",
          assigned: "#5B4B9E",
          inprogress: "#B07D1F",
          awaiting: "#A85B2B",
          resolved: "#1F7A4D",
          closed: "#31394A",
          transferred: "#1B6E6E",
        },
        priority: {
          low: "#5B6572",
          normal: "#1C5A8A",
          high: "#B07D1F",
          urgent: "#A32F2F",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
        ],
        serif: ["Georgia", "'Times New Roman'", "serif"],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "5px",
        md: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
