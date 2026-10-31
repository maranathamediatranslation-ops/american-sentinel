import netlifyReactRouter from "@netlify/vite-plugin-react-router";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // netlifyReactRouter packages the server build as a Netlify Function so
  // server-rendered routes work on Netlify.
  plugins: [tailwindcss(), reactRouter(), netlifyReactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  // Pre-bundle the admin's dependencies at startup. Otherwise Vite discovers
  // them on the first /admin visit and re-bundles mid-session, which can leave
  // the page with two copies of React ("Cannot read properties of null
  // (reading 'useContext')").
  optimizeDeps: {
    include: [
      "radix-ui",
      "lucide-react",
      "cn",
      "class-variance-authority",
      "@supabase/supabase-js",
    ],
  },
});
