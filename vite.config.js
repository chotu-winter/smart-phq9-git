import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: '/smart-phq9-git/', // important!
  plugins: [react()]

});
