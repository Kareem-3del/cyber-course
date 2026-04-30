import type { Config } from "tailwindcss";

/**
 * RawBlock token mapping.
 * The legacy app used semantic tokens (bg, panel, line, ink, mute, accent, ...).
 * We keep those names so the existing class soup keeps working, but every
 * value now maps to the brutalist palette: black, white, surface-sunken, and
 * the four state colors. `accent` and `blue` are deliberately the same
 * (#0000FF) — RawBlock reserves blue for links, period.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lessons/**/*.{ts,tsx}",
    "./content/**/*.md",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Work Sans", "var(--font-ar)", "system-ui", "sans-serif"],
        display: ["Archivo Black", "var(--font-ar)", "system-ui", "sans-serif"],
        mono: ["Space Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // base surfaces
        bg: "#FFFFFF",
        panel: "#FFFFFF",
        panel2: "#F0F0F0",
        sunken: "#F0F0F0",
        // structure
        line: "#000000",
        ink: "#000000",
        inkInv: "#FFFFFF",
        mute: "#555555",
        // semantic
        accent: "#000000",  // emphasis = black, never blue
        link: "#0000FF",
        red: "#FF0000",
        blue: "#0000FF",
        green: "#008000",
        amber: "#FFA500",
      },
      borderWidth: {
        DEFAULT: "3px",
        "0": "0",
        "1": "1px",
        "2": "2px",
        "3": "3px",
        "5": "5px",
      },
      borderRadius: {
        none: "0",
        DEFAULT: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        full: "9999px", // kept ONLY for radio dots / circular masks
      },
      boxShadow: {
        none: "none",
        glow: "none",
      },
      letterSpacing: {
        brut: "0.12em",
      },
    },
  },
  plugins: [],
};
export default config;
