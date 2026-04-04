import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-container-lowest": "#ffffff",
        "on-secondary-container": "#00355c",
        "outline-variant": "#becab9",
        "primary": "#006e1c",
        "secondary-fixed": "#d1e4ff",
        "inverse-on-surface": "#eff1ef",
        "secondary-fixed-dim": "#9ecaff",
        "surface-tint": "#006e1c",
        "on-primary": "#ffffff",
        "on-primary-container": "#003c0b",
        "on-secondary-fixed": "#001d36",
        "surface-variant": "#e1e3e1",
        "surface-dim": "#d8dad9",
        "surface-container-highest": "#e1e3e1",
        "tertiary-fixed": "#ffdf9e",
        "on-surface": "#191c1b",
        "on-secondary": "#ffffff",
        "tertiary-container": "#c49400",
        "on-background": "#191c1b",
        "on-primary-fixed": "#002204",
        "on-primary-fixed-variant": "#005313",
        "surface-container-high": "#e6e9e7",
        "inverse-surface": "#2e3130",
        "tertiary": "#785900",
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "surface-bright": "#f8faf8",
        "inverse-primary": "#78dc77",
        "on-error-container": "#93000a",
        "on-tertiary-fixed-variant": "#5b4300",
        "primary-container": "#4caf50",
        "error-container": "#ffdad6",
        "surface": "#f8faf8",
        "on-tertiary-container": "#433000",
        "primary-fixed-dim": "#78dc77",
        "on-secondary-fixed-variant": "#00497d",
        "primary-fixed": "#94f990",
        "tertiary-fixed-dim": "#fabd00",
        "outline": "#6f7a6b",
        "on-tertiary-fixed": "#261a00",
        "on-tertiary": "#ffffff",
        "background": "#f8faf8",
        "surface-container-low": "#f2f4f2",
        "secondary": "#0061a4",
        "on-surface-variant": "#3f4a3c",
        "secondary-container": "#33a0fd",
        "surface-container": "#eceeec"
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["var(--font-plus)", "sans-serif"],
        "body": ["var(--font-inter)", "sans-serif"],
        "label": ["var(--font-inter)", "sans-serif"]
      }
    },
  },
  plugins: [],
};

export default config;
