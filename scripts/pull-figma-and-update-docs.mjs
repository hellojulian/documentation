#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import fetch from "node-fetch";
import { config } from "dotenv";

// Load environment variables
config();

const FIGMA_API = "https://api.figma.com/v1";
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_KEY = process.env.FIGMA_FILE_KEY;

if (!FIGMA_TOKEN || !FIGMA_FILE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   FIGMA_TOKEN - Your Figma API token");
  console.error("   FIGMA_FILE_KEY - Your Figma file key from the URL");
  process.exit(1);
}

const headers = {
  "X-Figma-Token": FIGMA_TOKEN,
  "Content-Type": "application/json"
};

console.log("🎨 Starting Figma sync...");

/**
 * Fetch design tokens from Figma Variables
 */
async function fetchDesignTokens() {
  console.log("📦 Fetching design tokens...");
  
  try {
    const response = await fetch(`${FIGMA_API}/files/${FIGMA_FILE_KEY}/variables/local`, {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Transform Figma variables into design tokens format
    const tokens = transformVariablesToTokens(data);
    
    // Write tokens to file
    await fs.writeFile(
      "tokens/_data/tokens.json", 
      JSON.stringify(tokens, null, 2)
    );
    
    console.log("✅ Design tokens updated");
    return tokens;
  } catch (error) {
    console.error("❌ Failed to fetch design tokens:", error.message);
    return null;
  }
}

/**
 * Transform Figma variables into W3C design tokens format
 */
function transformVariablesToTokens(figmaData) {
  const tokens = {
    colors: {},
    typography: {},
    spacing: {},
    $lastSync: new Date().toISOString()
  };

  if (figmaData.meta?.variableCollections) {
    Object.values(figmaData.meta.variableCollections).forEach(collection => {
      if (figmaData.meta.variables) {
        Object.values(figmaData.meta.variables).forEach(variable => {
          if (variable.variableCollectionId === collection.id) {
            const tokenValue = variable.valuesByMode[collection.defaultModeId];
            
            // Categorize by variable name or collection
            if (variable.name.toLowerCase().includes('color') || collection.name.toLowerCase().includes('color')) {
              tokens.colors[variable.name] = {
                value: tokenValue,
                type: "color"
              };
            } else if (variable.name.toLowerCase().includes('spacing') || collection.name.toLowerCase().includes('spacing')) {
              tokens.spacing[variable.name] = {
                value: `${tokenValue}px`,
                type: "dimension"
              };
            } else if (variable.name.toLowerCase().includes('font') || collection.name.toLowerCase().includes('typography')) {
              tokens.typography[variable.name] = {
                value: tokenValue,
                type: "fontFamily"
              };
            }
          }
        });
      }
    });
  }

  return tokens;
}

/**
 * Fetch screenshots of specific Figma frames/nodes
 */
async function fetchScreenshots() {
  console.log("📸 Fetching screenshots...");
  
  // These would be your specific node IDs - update with your actual nodes
  const nodeIds = process.env.FIGMA_NODE_IDS?.split(',') || [];
  
  if (nodeIds.length === 0) {
    console.log("⚠️  No node IDs specified. Set FIGMA_NODE_IDS env var with comma-separated node IDs");
    return;
  }
  
  try {
    const response = await fetch(
      `${FIGMA_API}/images/${FIGMA_FILE_KEY}?ids=${nodeIds.join(",")}&format=png&scale=2`,
      { headers }
    );
    
    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }
    
    const { images } = await response.json();
    
    // Download each image
    for (const [nodeId, imageUrl] of Object.entries(images)) {
      if (imageUrl) {
        await downloadImage(imageUrl, `public/images/figma-${nodeId}.png`);
        console.log(`✅ Downloaded screenshot for node ${nodeId}`);
      }
    }
    
    console.log("✅ Screenshots updated");
  } catch (error) {
    console.error("❌ Failed to fetch screenshots:", error.message);
  }
}

/**
 * Download an image from URL to local file
 */
async function downloadImage(url, filepath) {
  const response = await fetch(url);
  const buffer = await response.buffer();
  await fs.writeFile(filepath, buffer);
}

/**
 * Update MDX files with latest sync timestamp
 */
async function updateDocumentation(tokens) {
  console.log("📝 Updating documentation...");
  
  try {
    // Update introduction with last sync time
    const introPath = "introduction.mdx";
    let introContent = await fs.readFile(introPath, "utf-8");
    
    const timestamp = new Date().toLocaleString();
    introContent = introContent.replace(
      /Last sync: \[AUTO-GENERATED\]/g,
      `Last sync: ${timestamp}`
    );
    
    await fs.writeFile(introPath, introContent);
    
    // Update tokens overview page
    if (tokens) {
      await updateTokensPages(tokens);
    }
    
    console.log("✅ Documentation updated");
  } catch (error) {
    console.error("❌ Failed to update documentation:", error.message);
  }
}

/**
 * Update token documentation pages
 */
async function updateTokensPages(tokens) {
  // Create colors page
  const colorsContent = generateColorsPage(tokens.colors);
  await fs.writeFile("tokens/colors.mdx", colorsContent);
  
  // Create spacing page
  const spacingContent = generateSpacingPage(tokens.spacing);
  await fs.writeFile("tokens/spacing.mdx", spacingContent);
  
  // Create typography page
  const typographyContent = generateTypographyPage(tokens.typography);
  await fs.writeFile("tokens/typography.mdx", typographyContent);
}

function generateColorsPage(colors) {
  return `---
title: "Colors"
description: "Design system color tokens synced from Figma"
---

# Color Tokens

<Note>Last synced: ${new Date().toLocaleString()}</Note>

${Object.entries(colors).map(([name, token]) => `
## ${name}
- **Value**: \`${token.value}\`
- **Type**: ${token.type}
<div style="background-color: ${token.value}; width: 100px; height: 50px; border: 1px solid #ccc;"></div>
`).join('\n')}
`;
}

function generateSpacingPage(spacing) {
  return `---
title: "Spacing"
description: "Design system spacing tokens synced from Figma"
---

# Spacing Tokens

<Note>Last synced: ${new Date().toLocaleString()}</Note>

${Object.entries(spacing).map(([name, token]) => `
## ${name}
- **Value**: \`${token.value}\`
- **Type**: ${token.type}
`).join('\n')}
`;
}

function generateTypographyPage(typography) {
  return `---
title: "Typography"
description: "Design system typography tokens synced from Figma"
---

# Typography Tokens

<Note>Last synced: ${new Date().toLocaleString()}</Note>

${Object.entries(typography).map(([name, token]) => `
## ${name}
- **Value**: \`${token.value}\`
- **Type**: ${token.type}
`).join('\n')}
`;
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Ensure directories exist
    await fs.mkdir("tokens/_data", { recursive: true });
    await fs.mkdir("public/images", { recursive: true });
    
    // Fetch data from Figma
    const tokens = await fetchDesignTokens();
    await fetchScreenshots();
    
    // Update documentation
    await updateDocumentation(tokens);
    
    console.log("🎉 Figma sync completed successfully!");
    
  } catch (error) {
    console.error("💥 Sync failed:", error);
    process.exit(1);
  }
}

// Run the script
main();