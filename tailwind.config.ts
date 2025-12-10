import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "light-blue": "var(--color-light-blue)",
        "navy-blue": "var(--color-navy-blue)",
      },
    },
  },
  safelist: [
    "bg-light-blue",
    "border-navy-blue",
    "text-navy-blue",
    "text-light-blue",
  ],
  plugins: [],
} satisfies Config;
