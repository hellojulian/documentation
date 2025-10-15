#!/usr/bin/env node

import fetch from "node-fetch";
import { config } from "dotenv";

config();

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = process.env.FIGMA_FILE_KEY;

const headers = {
  "X-Figma-Token": FIGMA_TOKEN,
  "Content-Type": "application/json"
};

async function testFileAccess() {
  console.log("🔍 Testing Figma file access...");
  console.log(`File key: ${FILE_KEY}`);
  
  try {
    const response = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}`, {
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Figma API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("✅ File access successful!");
    console.log(`File name: ${data.name}`);
    console.log(`Last modified: ${data.lastModified}`);
    
    // Check if we can access webhooks
    console.log("\n🔗 Testing webhook endpoint access...");
    const webhookResponse = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/webhooks`, {
      headers
    });
    
    console.log(`Webhook endpoint status: ${webhookResponse.status}`);
    if (webhookResponse.ok) {
      const webhookData = await webhookResponse.json();
      console.log("Existing webhooks:", webhookData);
    } else {
      const errorText = await webhookResponse.text();
      console.log("Webhook endpoint error:", errorText);
    }
    
  } catch (error) {
    console.error("❌ Failed:", error.message);
  }
}

testFileAccess();