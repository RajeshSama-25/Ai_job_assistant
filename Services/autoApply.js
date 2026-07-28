// ==========================================
// Auto-Apply (fill assistant) Service
// Services/autoApply.js
// ==========================================
//
// Important design decision: this fills in an application form on the
// employer's own site so the user doesn't have to retype the same details
// every time — it does NOT click the final submit button. The user asked
// to review and submit applications themselves, and many job sites'
// terms of service prohibit fully automated submissions anyway. This tool
// gets the form 90% done and hands control back with a screenshot.

import { chromium } from "playwright";

const FIELD_HINTS = {
    name: /full.?name|your.?name|^name$/i,
    email: /e-?mail/i,
    phone: /phone|mobile|contact.?number/i,
    linkedin: /linked.?in/i,
    github: /git.?hub/i,
    portfolio: /portfolio|website/i,
};

async function fillByHint(page, hintRegex, value) {
    if (!value) return false;

    const inputs = await page.locator("input, textarea").all();

    for (const input of inputs) {
        const attrs = await input.evaluate((el) => ({
            name: el.name || "",
            id: el.id || "",
            placeholder: el.placeholder || "",
            ariaLabel: el.getAttribute("aria-label") || "",
        }));

        const haystack = `${attrs.name} ${attrs.id} ${attrs.placeholder} ${attrs.ariaLabel}`;

        if (hintRegex.test(haystack)) {
            try {
                await input.fill(String(value));
                return true;
            } catch {
                // Field might be disabled/hidden — skip it, not fatal.
            }
        }
    }

    return false;
}

// Opens the job's apply page, fills what it recognizes from the user's
// profile, uploads the resume if a file input is found, and returns a
// screenshot for the user to check before they submit it themselves.
export async function prepareApplication(jobUrl, profile, resumeFilePath) {
    const browser = await chromium.launch({ headless: true });

    try {
        const page = await browser.newPage();
        await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

        const filled = {};

        for (const [field, regex] of Object.entries(FIELD_HINTS)) {
            if (profile[field]) {
                filled[field] = await fillByHint(page, regex, profile[field]);
            }
        }

        let resumeUploaded = false;
        if (resumeFilePath) {
            const fileInput = page.locator('input[type="file"]').first();
            if (await fileInput.count() > 0) {
                await fileInput.setInputFiles(resumeFilePath);
                resumeUploaded = true;
            }
        }

        const screenshot = await page.screenshot({ fullPage: true });

        return {
            success: true,
            fieldsFilled: filled,
            resumeUploaded,
            screenshotBase64: screenshot.toString("base64"),
            note: "Form filled for your review. Nothing has been submitted — open the job URL yourself to finish and submit.",
            jobUrl,
        };
    } finally {
        await browser.close();
    }
}
