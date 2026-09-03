import type { Config } from "tailwindcss";

// TropicalBytes design system — fresh green + yellow food-tech identity,
// per the client-approved reference screenshot. Existing component code
// references these same token names (forest/copper/cream/sand/ink), so
// retheming here cascades across the whole app without touching markup.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        cream: "#FAFBF7", // off-white — primary surface
        white: "#FFFFFF",
        sand: "#E3E9E2", // border / hairline
        palegreen: "#EFF9E9", // supporting section backgrounds
        // Brand green — primary identity, CTAs, strong brand areas
        forest: {
          DEFAULT: "#087A35", // primary green
          light: "#18A84A", // secondary green
          dark: "#075B2A", // dark green (footer, strong brand areas)
        },
        // Accent — repointed from the prior copper/terracotta palette to
        // the approved secondary-green accent family, so every existing
        // "copper" usage (eyebrow labels, prices, small CTAs) keeps solid
        // contrast on white. True brand yellow lives in `yellow.*` below
        // and is used deliberately for energetic highlights/badges.
        copper: {
          DEFAULT: "#18A84A",
          light: "#32C759",
          dark: "#075B2A",
        },
        // Brand yellow — energetic accent, highlights, selected emphasis
        yellow: {
          DEFAULT: "#FFD43B",
          light: "#FFF4C7",
          dark: "#E8B33B",
        },
        gold: {
          DEFAULT: "#E8B94A",
          light: "#F3D28A",
          dark: "#C79A2E",
        },
        // Dedicated error/validation color — kept separate from the brand
        // accent (which is now green) so form errors read as errors, not
        // as a success/brand color.
        danger: {
          DEFAULT: "#D64545",
          light: "#FBEAEA",
          dark: "#A62F2F",
        },
        // Dessert category indicator — a warm brown, kept distinct from
        // the Non-Veg red so the two aren't visually conflated on the
        // Menu page.
        brown: {
          DEFAULT: "#8A5A34",
          light: "#F3E6DA",
        },
        ink: "#202124", // text dark
        "ink-secondary": "#626B63", // text secondary
      },
      fontFamily: {
        // Modern, highly-readable sans throughout — no decorative/script
        // fonts, per the approved design direction.
        display: ["var(--font-manrope)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 8px 30px -12px rgba(8, 122, 53, 0.18)",
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};
export default config;
