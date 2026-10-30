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
});
