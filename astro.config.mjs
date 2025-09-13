// astro.config.mjs
// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import extractInlineIntegration from './integrations/extract-inline.js';
import bundleContentIntegration from "./integrations/bundle-content.js";

// https://astro.build/config
export default defineConfig({ integrations: [
    extractInlineIntegration(),  
    
  bundleContentIntegration({
      entry: "public/content-fragments/main.js", // <--- single entry file
      outFile: "content.js",
      minify: true,
      sourcemap: true,
      format: "iife",
    })
    // ... your other integrations
  ],
  
  vite: {
    plugins: [tailwindcss()],
  },
   build: {
    assets: 'my_assets' // change '_astro' to your own folder name
  },  
});