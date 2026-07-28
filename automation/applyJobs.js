// ==========================================
// CLI helper: test the auto-fill assistant against one job URL
// Usage: node automation/applyJobs.js "<jobUrl>"
// ==========================================

import fs from "fs";
import { prepareApplication } from "../Services/autoApply.js";

const jobUrl = process.argv[2];

if (!jobUrl) {
    console.error('Usage: node automation/applyJobs.js "<jobUrl>"');
    process.exit(1);
}

// Minimal profile for a manual smoke test — the real endpoint pulls this
// from the logged-in user's saved profile instead.
const testProfile = {
    name: "Test User",
    email: "test@example.com",
    phone: "9999999999",
};

const result = await prepareApplication(jobUrl, testProfile, null);

fs.writeFileSync("automation/last-run-screenshot.png", Buffer.from(result.screenshotBase64, "base64"));
console.log("Fields filled:", result.fieldsFilled);
console.log("Screenshot saved to automation/last-run-screenshot.png");
