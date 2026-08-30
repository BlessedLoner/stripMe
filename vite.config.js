import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({

  console.log("========== VITE BUILD DEBUG ==========");
console.log(
  "STRIPE KEY EXISTS:",
  Boolean(process.env.VITE_STRIPE_PUBLISHABLE_KEY),
);
console.log(
  "STRIPE KEY PREFIX:",
  process.env.VITE_STRIPE_PUBLISHABLE_KEY?.slice(0, 7),
);
console.log("======================================");

  plugins: [react(), tailwindcss()],
});
