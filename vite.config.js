import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  // Load env vars based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  console.log("========== VITE BUILD DEBUG ==========");
  console.log("Mode:", mode);
  console.log("STRIPE KEY EXISTS:", Boolean(env.VITE_STRIPE_PUBLISHABLE_KEY));
  console.log("STRIPE KEY PREFIX:", env.VITE_STRIPE_PUBLISHABLE_KEY?.slice(0, 7));
  console.log("======================================");

  return {
    plugins: [react(), tailwindcss()],
    define: {
      // Force inline the environment variable during build
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY || ''),
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
