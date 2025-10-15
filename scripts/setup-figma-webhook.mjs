#!/usr/bin/env node

import fetch from "node-fetch";
import { config } from "dotenv";

// Load environment variables
config();

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const WEBHOOK_SECRET = process.env.FIGMA_WEBHOOK_SECRET;

if (!FIGMA_TOKEN) {
  console.error("❌ Missing FIGMA_TOKEN environment variable");
  process.exit(1);
}

const headers = {
  "X-Figma-Token": FIGMA_TOKEN,
  "Content-Type": "application/json"
};

/**
 * List existing webhooks for a team
 */
async function listWebhooks(teamId) {
  console.log(`📋 Listing existing webhooks for team ${teamId}...`);
  
  try {
    const response = await fetch(`https://api.figma.com/v2/teams/${teamId}/webhooks`, {
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Figma API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Existing webhooks:", JSON.stringify(data, null, 2));
    return data.webhooks || [];
  } catch (error) {
    console.error("❌ Failed to list webhooks:", error.message);
    return [];
  }
}

/**
 * Create a new webhook using V1 API (for personal accounts)
 */
async function createWebhook(endpoint, fileKey) {
  console.log(`🔗 Creating webhook for endpoint: ${endpoint}`);
  console.log(`📄 File key: ${fileKey}`);
  
  const webhookPayload = {
    event_type: "FILE_UPDATE",
    endpoint: endpoint,
    passcode: WEBHOOK_SECRET || "default-secret-123"
  };
  
  try {
    // Try the v1 API for file-specific webhooks
    const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/webhooks`, {
      method: "POST",
      headers,
      body: JSON.stringify(webhookPayload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Figma API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("✅ Webhook created successfully:");
    console.log(JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error("❌ Failed to create webhook:", error.message);
    return null;
  }
}

/**
 * Delete a webhook
 */
async function deleteWebhook(webhookId) {
  console.log(`🗑️  Deleting webhook: ${webhookId}`);
  
  try {
    const response = await fetch(`https://api.figma.com/v2/webhooks/${webhookId}`, {
      method: "DELETE",
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }
    
    console.log("✅ Webhook deleted successfully");
    return true;
  } catch (error) {
    console.error("❌ Failed to delete webhook:", error.message);
    return false;
  }
}

/**
 * Get team information
 */
async function getTeamInfo() {
  console.log("👥 Getting team information...");
  
  try {
    const response = await fetch("https://api.figma.com/v1/me", {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("User info:", JSON.stringify(data, null, 2));
    
    // Get the first team ID if available
    if (data.teams && data.teams.length > 0) {
      return data.teams[0].id;
    }
    
    throw new Error("No teams found for this user");
  } catch (error) {
    console.error("❌ Failed to get team info:", error.message);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2];
  const endpoint = process.argv[3];
  
  console.log("🎨 Figma Webhook Setup Tool");
  console.log("===============================");
  
  switch (command) {
    case "list":
      const teamId = await getTeamInfo();
      if (teamId) {
        await listWebhooks(teamId);
      }
      break;
      
    case "create":
      if (!endpoint) {
        console.error("❌ Usage: npm run webhook:setup create <endpoint-url>");
        console.error("   Example: npm run webhook:setup create https://your-ngrok-url.ngrok.io/api/figma-webhook");
        process.exit(1);
      }
      
      const fileKey = process.env.FIGMA_FILE_KEY;
      if (!fileKey) {
        console.error("❌ Missing FIGMA_FILE_KEY environment variable");
        process.exit(1);
      }
      await createWebhook(endpoint, fileKey);
      break;
      
    case "delete":
      const webhookId = endpoint; // reuse the parameter
      if (!webhookId) {
        console.error("❌ Usage: npm run webhook:setup delete <webhook-id>");
        process.exit(1);
      }
      await deleteWebhook(webhookId);
      break;
      
    case "cleanup":
      const cleanupTeamId = await getTeamInfo();
      if (cleanupTeamId) {
        const webhooks = await listWebhooks(cleanupTeamId);
        for (const webhook of webhooks) {
          await deleteWebhook(webhook.id);
        }
      }
      break;
      
    default:
      console.log("Usage:");
      console.log("  npm run webhook:setup list                     - List existing webhooks");
      console.log("  npm run webhook:setup create <endpoint-url>    - Create new webhook");
      console.log("  npm run webhook:setup delete <webhook-id>      - Delete specific webhook");
      console.log("  npm run webhook:setup cleanup                  - Delete all webhooks");
      console.log("");
      console.log("Examples:");
      console.log("  npm run webhook:setup create https://abc123.ngrok.io/api/figma-webhook");
      console.log("  npm run webhook:setup create https://mintlify-eight.vercel.app/api/figma-webhook");
      break;
  }
}

main().catch(console.error);