module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        yk: {
          blue: "var(--yk-blue)",
          red: "var(--yk-red)",
          gray: "var(--yk-gray)",
          bg: "var(--yk-bg)",
          surface: "var(--yk-surface)",
          border: "var(--yk-border)"
        }
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Public Sans", "sans-serif"]
      },
      boxShadow: {
        card: "0 10px 30px rgba(0, 0, 0, 0.08)",
        soft: "0 6px 20px rgba(0, 0, 0, 0.06)"
      }
    }
  },
  plugins: []
};
