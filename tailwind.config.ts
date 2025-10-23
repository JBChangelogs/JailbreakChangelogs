import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Enable manual dark mode toggling
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      screens: {
        xs: "375px",
        "3xl": "1920px",
      },
      aspectRatio: {
        card: "1 / 1",
      },
      colors: {
        // Background Colors
        "primary-bg": "var(--color-primary-bg)",
        "secondary-bg": "var(--color-secondary-bg)",
        "tertiary-bg": "var(--color-tertiary-bg)",
        "quaternary-bg": "var(--color-quaternary-bg)",
        "surface-bg": "var(--color-surface-bg)",
        "overlay-bg": "var(--color-overlay-bg)",
        "newsletter-bg": "var(--color-newsletter-bg)",

        // Text Colors
        "primary-text": "var(--color-primary-text)",
        "secondary-text": "var(--color-secondary-text)",
        "tertiary-text": "var(--color-tertiary-text)",
        "quaternary-text": "var(--color-quaternary-text)",
        "card-headline": "var(--color-card-headline)",
        "card-paragraph": "var(--color-card-paragraph)",

        // Border Colors
        "border-primary": "var(--color-border-primary)",
        "border-secondary": "var(--color-border-secondary)",
        "border-tertiary": "var(--color-border-tertiary)",
        "border-focus": "var(--color-border-focus)",
        "border-error": "var(--color-border-error)",

        // Card Elements
        "card-tag-bg": "var(--color-card-tag-bg)",
        "card-tag-text": "var(--color-card-tag-text)",
        "card-highlight": "var(--color-card-highlight)",
        "card-shadow": "var(--color-card-shadow)",

        // Interactive Elements
        link: "var(--color-link)",
        "link-hover": "var(--color-link-hover)",
        "link-active": "var(--color-link-active)",
        "link-visited": "var(--color-link-visited)",

        // Button Colors
        "button-info": "var(--color-button-info)",
        "button-info-hover": "var(--color-button-info-hover)",
        "button-info-active": "var(--color-button-info-active)",
        "button-info-disabled": "var(--color-button-info-disabled)",
        "button-success": "var(--color-button-success)",
        "button-success-hover": "var(--color-button-success-hover)",
        "button-danger": "var(--color-button-danger)",
        "button-danger-hover": "var(--color-button-danger-hover)",
        "button-secondary": "var(--color-button-secondary)",
        "button-secondary-hover": "var(--color-button-secondary-hover)",
        "form-button": "var(--color-form-button)",
        "form-button-text": "var(--color-form-button-text)",

        // Form Elements
        "form-input": "var(--color-form-input)",
        "form-input-focus": "var(--color-form-input-focus)",
        "form-input-disabled": "var(--color-form-input-disabled)",
        "form-label": "var(--color-form-label)",
        "form-placeholder": "var(--color-form-placeholder)",
        "form-error": "var(--color-form-error)",
        "form-success": "var(--color-form-success)",

        // Status Colors
        "status-success": "var(--color-status-success)",
        "status-warning": "var(--color-status-warning)",
        "status-error": "var(--color-status-error)",
        "status-info": "var(--color-status-info)",
        "status-neutral": "var(--color-status-neutral)",

        // Utility Colors
        highlight: "var(--color-highlight)",
        secondary: "var(--color-secondary)",
        tertiary: "var(--color-tertiary)",
        stroke: "var(--color-stroke)",

        // Warning Colors
        warning: "var(--color-warning)",
        "warning-light": "var(--color-warning-light)",
        "warning-dark": "var(--color-warning-dark)",

        // Opacity Variations
        "overlay-light": "var(--color-overlay-light)",
        "overlay-medium": "var(--color-overlay-medium)",
        "overlay-dark": "var(--color-overlay-dark)",
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
};

export default config;
