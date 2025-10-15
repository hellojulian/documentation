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

async function testVariablesAccess() {
  console.log("🔍 Testing Figma Variables API access...");
  console.log(`File key: ${FILE_KEY}`);
  
  // Test different Variables API endpoints
  const endpoints = [
    `https://api.figma.com/v1/files/${FILE_KEY}/variables/local`,
    `https://api.figma.com/v1/files/${FILE_KEY}/variables`,
    `https://api.figma.com/v1/teams/${FILE_KEY}/variables` // Wrong but let's test
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔗 Testing: ${endpoint}`);
    
    try {
      const response = await fetch(endpoint, { headers });
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Success! Data preview:", JSON.stringify(data, null, 2).substring(0, 500) + "...");
        return data;
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
  }
  
  // Also test what we can access about the file
  console.log(`\n🔗 Testing file info access...`);
  try {
    const response = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}`, { headers });
    if (response.ok) {
      const data = await response.json();
      console.log("File info access: ✅");
      console.log(`File name: ${data.name}`);
      console.log(`Components: ${Object.keys(data.components || {}).length}`);
      console.log(`Styles: ${Object.keys(data.styles || {}).length}`);
    }
  } catch (error) {
    console.log("File info access: ❌", error.message);
  }
}

testVariablesAccess();