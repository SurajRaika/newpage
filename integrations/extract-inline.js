import glob from "tiny-glob";
import path from "path";
import fs from "fs/promises";

function hash(value) {
  let hash = 5381;
  let i = value.length;
  while (i) hash = (hash * 33) ^ value.charCodeAt(--i);
  return (hash >>> 0).toString(36);
}

export default function extractInlineIntegration() {
  return {
    name: "astro-extract-inline",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        console.log("🚀 Extracting Inline Scripts and Styles...");
        
        try {
          const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
          const styleRegex = /<style(?![^>]*\bhref\b)[^>]*>([\s\S]*?)<\/style>/gi;
          
          // Handle both Windows and Unix paths
          const normalizedPath = path.normalize(dir.pathname.replace(/^file:\/\//, ''));
          const actualPath = normalizedPath.startsWith('/') && process.platform === 'win32' 
            ? normalizedPath.substring(1) 
            : normalizedPath;

          console.log(`📁 Processing directory: ${actualPath}`);

          const files = await glob("**/*.html", {
            cwd: actualPath,
            filesOnly: true,
          });

          if (files.length === 0) {
            console.log("ℹ️  No HTML files found to process");
            return;
          }

          console.log(`📄 Found ${files.length} HTML file(s) to process`);

          let totalScripts = 0;
          let totalStyles = 0;

          for (const file of files) {
            console.log(`🔄 Processing: ${file}`);
            
            try {
              const filePath = path.join(actualPath, file);
              let content = await fs.readFile(filePath, "utf-8");
              
              // Count matches before processing
              const scriptMatches = [...content.matchAll(scriptRegex)];
              const styleMatches = [...content.matchAll(styleRegex)];
              
              if (scriptMatches.length === 0 && styleMatches.length === 0) {
                console.log(`  ➡️  No inline scripts or styles found`);
                continue;
              }

              // Extract and replace inline scripts
              const { content: scriptProcessedContent, count: scriptCount } = 
                await extractAndReplace(content, scriptRegex, actualPath, "script", "js");
              
              // Extract and replace inline styles
              const { content: finalContent, count: styleCount } = 
                await extractAndReplace(scriptProcessedContent, styleRegex, actualPath, "style", "css");

              if (scriptCount > 0 || styleCount > 0) {
                await fs.writeFile(filePath, finalContent);
                console.log(`  ✅ Extracted ${scriptCount} script(s) and ${styleCount} style(s)`);
                totalScripts += scriptCount;
                totalStyles += styleCount;
              }

            } catch (error) {
              console.error(`  ❌ Error processing ${file}:`, error.message);
            }
          }

          console.log(`🎉 Extraction complete! Total: ${totalScripts} scripts, ${totalStyles} styles`);

        } catch (error) {
          console.error("❌ Fatal error during extraction:", error);
          throw error;
        }
      },
    },
  };
}

async function extractAndReplace(content, regex, directory, prefix, extension) {
  let processedContent = content;
  let extractCount = 0;
  
  // Reset regex to ensure we start from the beginning
  regex.lastIndex = 0;
  
  const matches = [...content.matchAll(regex)];
  
  for (const match of matches) {
    const inlineContent = match[1].trim();
    
    // Skip empty content
    if (!inlineContent) {
      console.log(`  ⚠️  Skipping empty ${prefix} tag`);
      processedContent = processedContent.replace(match[0], '');
      continue;
    }

    const contentHash = hash(inlineContent);
    const fileName = `${prefix}-${contentHash}.${extension}`;
    const filePath = path.join(directory, fileName);

    try {
      // Check if file already exists to avoid duplicate writes
      try {
        await fs.access(filePath);
        console.log(`  ♻️  Reusing existing ${prefix} file: ${fileName}`);
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(filePath, inlineContent, 'utf-8');
        console.log(`  💾 Created ${prefix} file: ${fileName}`);
      }

      // Create replacement tag
      const replacement = extension === "js" 
        ? `<script type="module" src="/${fileName}"></script>`
        : `<link rel="stylesheet" href="/${fileName}" />`;

      processedContent = processedContent.replace(match[0], replacement);
      extractCount++;

    } catch (error) {
      console.error(`  ❌ Error writing ${prefix} file ${fileName}:`, error.message);
    }
  }

  return { content: processedContent, count: extractCount };
}