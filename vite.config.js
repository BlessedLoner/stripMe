import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Load env vars based on mode (production, development, etc.)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get the key from env
  const stripeKey = env.VITE_STRIPE_PUBLISHABLE_KEY || '';
  
  console.log("========== VITE BUILD DEBUG ==========");
  console.log("Mode:", mode);
  console.log("STRIPE KEY EXISTS:", Boolean(stripeKey));
  console.log("STRIPE KEY PREFIX:", stripeKey?.slice(0, 7));
  console.log("STRIPE KEY LENGTH:", stripeKey?.length || 0);
  console.log("======================================");

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // ✅ FORCE the value to be inlined
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(stripeKey),
    },
  };
});

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react(), tailwindcss()],
// });
