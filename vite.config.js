import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: change `base` to match your repo name when deploying to GitHub Pages.
// Example: if your repo URL is github.com/yourname/cairn-prototype,
// the base must be "/cairn-prototype/".
// If you deploy to a custom domain or to a `<username>.github.io` repo, use "/".
export default defineConfig({
  plugins: [react()],
  base: "/cairn-prototype/",
});
