import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path matches the GitHub repo name "Cairn" (case-sensitive).
// If you fork or rename the repo, change this to "/<your-repo-name>/".
// If deploying to a custom domain or to a `<username>.github.io` repo, use "/".
export default defineConfig({
  plugins: [react()],
  base: "/Cairn/",
});
