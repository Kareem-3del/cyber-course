import type { Config } from "tailwindcss";

/**
 * RawBlock token mapping.
 *
 * Every color now points at a CSS custom property defined in `globals.css`.
 * That single indirection is what lets dark mode work: setting
 * `data-theme="dark"` on <html> swaps the values of those custom properties,
 * which automatically repaints every `bg-white`, `text-black`, `border-black`
 * across the codebase without us having to add a `dark:` variant on each one.
 *
 * - `white`  → `var(--rb-white)`  (light: #FFFFFF, dark: #000000)
 * - `black`  → `var(--rb-black)`  (light: #000000, dark: #FFFFFF)
 * - state colors track the same variables.
 *
 * Blue (#0000FF) stays hard-coded everywhere it really must remain blue
 * (the RawBlock spec reserves it for hyperlinks).
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
        sans: ["Work Sans", "system-ui", "sans-serif"],
        display: ["Archivo Black", "system-ui", "sans-serif"],
        mono: ["Space Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        // Theme-aware — flip with data-theme="dark".
        white:  "var(--rb-white)",
        black:  "var(--rb-black)",
        // Semantic surface tokens (re-mapped to the new palette).
        bg:     "var(--rb-white)",
        panel:  "var(--rb-white)",
        panel2: "var(--rb-sunken)",
        sunken: "var(--rb-sunken)",
        line:   "var(--rb-black)",
        ink:    "var(--rb-black)",
        inkInv: "var(--rb-white)",
        mute:   "var(--rb-disabled)",
        accent: "var(--rb-black)",
        link:   "var(--rb-link)",
        red:    "var(--rb-error)",
        blue:   "var(--rb-link)",
        green:  "var(--rb-success)",
        amber:  "var(--rb-warning)",
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
