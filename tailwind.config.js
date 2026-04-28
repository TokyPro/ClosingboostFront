/** @type {import('tailwindcss').Config} */

const cv = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;
const ac = (name) => `rgb(var(--accent-${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Surface system */
        "background":                   cv("background"),
        "on-background":                cv("on-background"),
        "surface":                      cv("surface"),
        "surface-bright":               cv("surface-bright"),
        "surface-dim":                  cv("surface-dim"),
        "surface-variant":              cv("surface-variant"),
        "surface-tint":                 cv("surface-tint"),
        "surface-container-lowest":     cv("surface-container-lowest"),
        "surface-container-low":        cv("surface-container-low"),
        "surface-container":            cv("surface-container"),
        "surface-container-high":       cv("surface-container-high"),
        "surface-container-highest":    cv("surface-container-highest"),
        "on-surface":                   cv("on-surface"),
        "on-surface-variant":           cv("on-surface-variant"),
        "inverse-surface":              cv("inverse-surface"),
        "inverse-on-surface":           cv("inverse-on-surface"),
        "outline":                      cv("outline"),
        "outline-variant":              cv("outline-variant"),

        /* Primary / brand */
        "primary":                      cv("primary"),
        "on-primary":                   cv("on-primary"),
        "primary-container":            cv("primary-container"),
        "on-primary-container":         cv("on-primary-container"),
        "primary-fixed":                cv("primary-fixed"),
        "primary-fixed-dim":            cv("primary-fixed-dim"),
        "on-primary-fixed":             cv("on-primary-fixed"),
        "on-primary-fixed-variant":     cv("on-primary-fixed-variant"),
        "inverse-primary":              cv("inverse-primary"),

        /* Secondary */
        "secondary":                    cv("secondary"),
        "on-secondary":                 cv("on-secondary"),
        "secondary-container":          cv("secondary-container"),
        "on-secondary-container":       cv("on-secondary-container"),
        "secondary-fixed":              cv("secondary-fixed"),
        "secondary-fixed-dim":          cv("secondary-fixed-dim"),
        "on-secondary-fixed":           cv("on-secondary-fixed"),
        "on-secondary-fixed-variant":   cv("on-secondary-fixed-variant"),

        /* Tertiary (cobalt blue affirmation) */
        "tertiary":                     cv("tertiary"),
        "on-tertiary":                  cv("on-tertiary"),
        "tertiary-container":           cv("tertiary-container"),
        "on-tertiary-container":        cv("on-tertiary-container"),
        "tertiary-fixed":               cv("tertiary-fixed"),
        "tertiary-fixed-dim":           cv("tertiary-fixed-dim"),
        "on-tertiary-fixed":            cv("on-tertiary-fixed"),
        "on-tertiary-fixed-variant":    cv("on-tertiary-fixed-variant"),

        /* Error */
        "error":                        cv("error"),
        "on-error":                     cv("on-error"),
        "error-container":              cv("error-container"),
        "on-error-container":           cv("on-error-container"),

        /* Aurora accent palette */
        "accent-cobalt":    ac("cobalt"),
        "accent-lime":      ac("lime"),
        "accent-cyan":      ac("cyan"),
        "accent-amber":     ac("amber"),
        "accent-magenta":   ac("magenta"),
      },

      borderRadius: {
        DEFAULT: "0.25rem",
        sm: "6px",
        md: "10px",
        lg:  "14px",
        xl:  "20px",
        "2xl": "28px",
        full: "9999px",
      },

      fontFamily: {
        headline: ["Geist", "var(--font-manrope)", "Manrope", "sans-serif"],
        body:     ["Geist", "var(--font-inter)",   "Inter",   "sans-serif"],
        label:    ["Geist", "var(--font-inter)",   "Inter",   "sans-serif"],
        mono:     ["Geist Mono", "ui-monospace", "monospace"],
      },

      boxShadow: {
        cta:          "0 12px 32px rgb(59 91 255 / 0.32)",
        "glow-cobalt":"0 0 0 1px rgb(59 91 255 / 0.30), 0 12px 36px rgb(59 91 255 / 0.30)",
        "glow-lime":  "0 0 0 1px rgb(199 240 96 / 0.45), 0 12px 36px rgb(199 240 96 / 0.30)",
        "glow-cyan":  "0 0 0 1px rgb(0 207 255 / 0.40), 0 12px 36px rgb(0 207 255 / 0.30)",
      },

      backgroundImage: {
        "gradient-cta":    "var(--gradient-primary-cta)",
        "gradient-affirm": "var(--gradient-affirm)",
        "gradient-success":"var(--gradient-success)",
        "gradient-warm":   "var(--gradient-warm)",
      },
    },
  },
  plugins: [],
};
