// test-kobo-connection.js
// Simple version using built-in fetch (for Node.js v18+)

const fs = require("fs");
const path = require("path");

// Simple function to load .env.local variables
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");
    const envContent = fs.readFileSync(envPath, "utf8");
    const envLines = envContent.split("\n");

    for (const line of envLines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=");
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    }

    console.log("Loaded environment variables from .env.local");
  } catch (error) {
    console.error("Error loading .env.local:", error.message);
  }
}

// Load environment variables
loadEnv();

async function testKoboConnection() {
  const username = process.env.KOBOTOOLBOX_USERNAME;
  const token = process.env.KOBOTOOLBOX_TOKEN;
  const assetsUrl = process.env.ASSETS_URL;

  if (!username || !token || !assetsUrl) {
    console.error("Missing required environment variables!");
    console.error("KOBOTOOLBOX_USERNAME:", username ? "✓" : "✗");
    console.error("KOBOTOOLBOX_TOKEN:", token ? "✓" : "✗");
    console.error("ASSETS_URL:", assetsUrl ? "✓" : "✗");
    return;
  }

  console.log("Testing connection to KoboToolbox global server...");
  console.log("Using assets URL:", assetsUrl);

  // Global KoboToolbox uses Token auth
  const authHeader = `Token ${token}`;

  try {
    const response = await fetch(assetsUrl, {
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      console.error("Error response from server!");

      try {
        // Try to parse error response as JSON
        const errorData = await response.json();
        console.error("Error details:", JSON.stringify(errorData, null, 2));
      } catch {
        // If not JSON, get text
        const errorText = await response.text();
        console.error(
          "Error response body:",
          errorText.substring(0, 500) + (errorText.length > 500 ? "..." : "")
        );
      }

      return;
    }

    const data = await response.json();
    console.log("Connection successful! ✓");
    console.log(`Found ${data.count || "unknown"} forms`);

    if (data.results && data.results.length > 0) {
      console.log("First form details:");
      console.log("  Name:", data.results[0].name);
      console.log("  ID:", data.results[0].uid);
      console.log(
        "  Created:",
        new Date(data.results[0].date_created).toLocaleString()
      );
    } else {
      console.log("No forms found in the account");
    }
  } catch (error) {
    console.error("Connection failed!");
    console.error("Error:", error.message);
    if (error.stack) console.error("Stack:", error.stack);
  }
}

testKoboConnection();
