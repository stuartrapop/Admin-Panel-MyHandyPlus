import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: true
  },
  build: {
    sourcemap: mode === "development"
  },
  // Update this to match your GitHub repository name
  // Format: /repository-name/
  base: process.env.GITHUB_PAGES ? "/Admin-Panel-MyHandyPlus/" : "./"
}))
