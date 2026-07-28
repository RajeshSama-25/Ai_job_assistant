// ==========================================
// Resume Parser
// Services/resumeParser.js
// ==========================================
//
// Extracts plain text from an uploaded resume so it can be sent to the AI
// service for optimization suggestions / cover letter generation.

import fs from "fs/promises";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function parseResume(filePath, mimetype) {
    try {
        const buffer = await fs.readFile(filePath);

        if (mimetype === "application/pdf") {
            const data = await pdfParse(buffer);
            return data.text;
        }

        if (
            mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            mimetype === "application/msword"
        ) {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }

        // Fallback: try reading as plain text
        return buffer.toString("utf8");
    } catch (error) {
        console.error("Resume parse error:", error.message);
        return "";
    }
}
