import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1c2936",
        mist: "#edf1f5",
        sky: "#83d3ff",
        surge: "#6170f7",
        glow: "#b8d98d",
        peach: "#efd4a5",
        shell: "#e6eaef"
      },
      boxShadow: {
        soft:
          "12px 12px 28px rgba(161, 170, 179, 0.58), -12px -12px 28px rgba(255, 255, 255, 0.9)",
        glass:
          "10px 10px 24px rgba(103, 118, 201, 0.28), -8px -8px 18px rgba(255, 255, 255, 0.34)",
        inset:
          "inset 10px 10px 20px rgba(177, 184, 192, 0.92), inset -10px -10px 20px rgba(255, 255, 255, 0.85)"
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem"
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at top left, rgba(255,255,255,0.95), transparent 22%), radial-gradient(circle at bottom right, rgba(255,255,255,0.7), transparent 30%), linear-gradient(180deg, #eef2f6 0%, #dde2e8 100%)",
        "neu-primary":
          "linear-gradient(145deg, #7a86ff 0%, #5764df 100%)",
        "neu-secondary":
          "linear-gradient(145deg, #f6f8fa 0%, #d4d9df 100%)",
        "neu-success":
          "linear-gradient(145deg, #dcecc9 0%, #aacb8b 100%)"
      }
    }
  },
  plugins: []
};

export default config;
