import type { Config } from "tailwindcss";

const config: Config = {
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
        // Custom SEO bands colors
        p1top: {
          DEFAULT: "#16a34a",
          bg: "#f0fdf4",
          text: "#166534",
          border: "#bbf7d0",
        },
        p1good: {
          DEFAULT: "#2563eb",
          bg: "#eff6ff",
          text: "#1e40af",
          border: "#bfdbfe",
        },
        page2: {
          DEFAULT: "#ca8a04",
          bg: "#fef9c3",
          text: "#854d0e",
          border: "#fef08a",
        },
        page3: {
          DEFAULT: "#ea580c",
          bg: "#fff7ed",
          text: "#9a3412",
          border: "#ffedd5",
        },
        page4: {
          DEFAULT: "#dc2626",
          bg: "#fef2f2",
          text: "#991b1b",
          border: "#fee2e2",
        },
        notranking: {
          DEFAULT: "#6b7280",
          bg: "#f9fafb",
          text: "#374151",
          border: "#e5e7eb",
        },
        // Premium corporate brand colors
        brand: {
          50: '#f5f7fa',
          100: '#eaeef4',
          200: '#d5dde9',
          300: '#b3c3d8',
          400: '#8ca2c3',
          500: '#6882ac',
          600: '#526b94',
          700: '#425578',
          800: '#394864',
          900: '#323d53',
          950: '#1b2330',
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
