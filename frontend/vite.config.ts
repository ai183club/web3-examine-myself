import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

import { sites } from "./build/sites-vite-plugin.js";

export default defineConfig({
  envDir: "..",
  plugins: [react(), sites()],
  build: {
    emptyOutDir: true,
    outDir: "../dist",
  },
});
