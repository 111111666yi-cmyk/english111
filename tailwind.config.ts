import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#102033",
        mist: "#eef6ff",
        sky: "#4ecbff",
        surge: "#5b6cff",
        glow: "#b4ff7a",
        peach: "#ffd48c",
        shell: "#f8fbff"
      },
      boxShadow: {
        soft: "0 22px 60px rgba(23, 46, 84, 0.12)",
        glass: "0 10px 30px rgba(91, 108, 255, 0.14)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at top left, rgba(91,108,255,0.25), transparent 30%), radial-gradient(circle at bottom right, rgba(78,203,255,0.22), transparent 32%), linear-gradient(180deg, #f7fbff 0%, #edf5ff 100%)"
      }
    }
  },
  plugins: []
};

export default config;
