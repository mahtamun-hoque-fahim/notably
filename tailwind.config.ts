import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#f5f3ec",
        "bg-elev": "#faf8f1",
        paper: "#ffffff",
        ink: "#1c2420",
        "ink-mute": "#4a544c",
        "ink-soft": "#7a8580",
        sage: "#4f7a5a",
        "sage-deep": "#2d5b3e",
        "sage-soft": "#dce5d4",
        "sage-pale": "#ecf1e7",
        line: "rgba(28, 36, 32, 0.08)",
        "line-strong": "rgba(28, 36, 32, 0.14)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-instrument)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
