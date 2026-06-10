/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

module.exports = {
  theme: {
    extend: {
      screens: {
        ipad: "834px",
        "ipad-pro": "1024px",
        "ipad-pro-landscape": "1366px",
      },
    },
  },
};
