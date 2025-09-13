// integrations/bundle-content.js
import fs from "fs/promises";
import path from "path";
import os from "os";
import { build as esbuildBuild } from "esbuild";
import { fileURLToPath } from "url";

/**
 * options:
 *  - entry: entry file (project-relative), if provided we bundle only that
 *  - fragmentsDir: fallback dir to scan (default: "public/content-fragments")
 *  - outFile: filename in final build dir (default: "content.js")
 *  - minify, sourcemap, format
 */
export default function bundleContentIntegration(userOptions = {}) {
  const opts = {
    entry: null, // e.g. "public/content-fragments/main.js" — if set, we use this single entry
    fragmentsDir: "public/content-fragments",
    outFile: "content.js",
    minify: true,
    sourcemap: true,
    format: "iife",
    ...userOptions,
  };

  function normalizeOutDir(dir) {
    // dir might be a string, a URL, or some object depending on Astro/Vite version
    if (typeof dir === "string") return dir;
    if (dir instanceof URL) return fileURLToPath(dir);
    // some versions pass an object like { dir: "/abs/path" } or { outDir: "/abs/path" }
    if (dir && typeof dir === "object") {
      if (typeof dir.dir === "string") return dir.dir;
      if (typeof dir.outDir === "string") return dir.outDir;
      if (typeof dir.pathname === "string") return dir.pathname;
    }
    // fallback to string coercion
    return String(dir);
  }

  return {
    name: "astro-integration-bundle-content",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        try {
          const projectRoot = process.cwd();
          const outDir = normalizeOutDir(dir);

          // If a single entry is provided, use that
          if (opts.entry) {
            const entryPath = path.resolve(projectRoot, opts.entry);
            // ensure entry exists
            try {
              await fs.access(entryPath);
            } catch {
              console.log(`[bundle-content] entry not found: ${entryPath}, skipping.`);
              return;
            }

            await esbuildBuild({
              entryPoints: [entryPath],
              bundle: true,
              minify: !!opts.minify,
              sourcemap: !!opts.sourcemap,
              format: opts.format === "esm" ? "esm" : "iife",
              outfile: path.join(outDir, opts.outFile),
              platform: "browser",
              target: ["es2018"],
              legalComments: "none",
            });

            console.log(`[bundle-content] bundled entry ${opts.entry} → ${path.join(outDir, opts.outFile)}`);
            return;
          }

          // Otherwise scan fragmentsDir
          const fragDir = path.resolve(projectRoot, opts.fragmentsDir);
          let files;
          try {
            files = await fs.readdir(fragDir);
          } catch (e) {
            console.log(`[bundle-content] fragments dir not found (${fragDir}), skipping.`);
            return;
          }

          const jsFiles = files.filter((f) => f.endsWith(".js")).sort();
          if (jsFiles.length === 0) {
            console.log(`[bundle-content] no .js fragments in ${fragDir}, skipping.`);
            return;
          }

          // Prepare temp entry
          const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "astro-bundle-"));
          const entryPath = path.join(tmpDir, "entry.js");

          const importLines = jsFiles
            .map((f) => {
              const absolute = path.join(fragDir, f);
              const rel = `./${path.relative(tmpDir, absolute).replace(/\\/g, "/")}`;
              return `import "${rel}";`;
            })
            .join("\n");

          await fs.writeFile(entryPath, importLines, "utf8");

          await esbuildBuild({
            entryPoints: [entryPath],
            bundle: true,
            minify: !!opts.minify,
            sourcemap: !!opts.sourcemap,
            format: opts.format === "esm" ? "esm" : "iife",
            outfile: path.join(outDir, opts.outFile),
            platform: "browser",
            target: ["es2018"],
            legalComments: "none",
          });

          // cleanup temp dir (best-effort)
          try {
            await fs.rm(tmpDir, { recursive: true, force: true });
          } catch (e) {}

          console.log(
            `[bundle-content] bundled ${jsFiles.length} fragments → ${path.relative(projectRoot, path.join(outDir, opts.outFile))}`
          );
        } catch (err) {
          console.error("[bundle-content] build failed:", err);
        }
      },
    },
  };
}
