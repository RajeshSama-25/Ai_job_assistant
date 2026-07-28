import cron from "node-cron";

import { searchJobs } from "./jobSearch.js";
import { checkEmailsForAllConnectedUsers } from "./gmailMonitor.js";

// Every 6 hours: refresh job listings and check Gmail for every user who has
// connected their account.
cron.schedule("0 */6 * * *", async () => {

    console.log("\n===== AI Agent Started =====");

    await searchJobs().catch((e) => console.error("Scheduled job search failed:", e.message));

    await checkEmailsForAllConnectedUsers().catch((e) =>
        console.error("Scheduled Gmail check failed:", e.message)
    );

});
