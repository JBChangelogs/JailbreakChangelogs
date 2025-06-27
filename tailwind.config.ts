import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2e3944",
        },
        secondary: {
          DEFAULT: "#212a31",
        },
        accent: {
          DEFAULT: "#124E66",
        },
        text: {
          primary: "#000000",
          secondary: "#FFFFFF",
        },
      },
      aspectRatio: {
        card: "1 / 1",
      },
    },
  },
  plugins: [],
};

export default config;
