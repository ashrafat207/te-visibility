import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

declare const process: { env: Record<string, string | undefined> }

// GitHub Pages serves this app from a /<repo>/ subpath; Vercel serves it from the domain root.
// GITHUB_PAGES=1 is set only by the gh-pages build step below.
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/te-visibility/' : '/',
  plugins: [react()],
})
