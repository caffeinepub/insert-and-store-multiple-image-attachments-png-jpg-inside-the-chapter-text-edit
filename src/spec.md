# Specification

## Summary
**Goal:** Fix chapter export to PDF/DOCX so it reliably generates and downloads valid files (including for empty chapters), and replace the generic “export failed” message with clearer, actionable errors.

**Planned changes:**
- Backend: Repair the chapter export APIs for PDF and DOCX to always return a downloadable binary payload for empty and non-empty chapters (including formatted text).
- Backend: Ensure canister-stored image attachments are embedded directly into exported PDF/DOCX files (no external links).
- Backend: Return clear, debuggable errors on export failures so the frontend can display an actionable message.
- Frontend: Fix the chapter editor export flow so “Export PDF” and “Export DOCX” reliably trigger a browser file download.
- Frontend: Add/ensure an exporting state that prevents repeated clicks while an export is in progress.
- Frontend: Improve export failure toasts/messages to be in English and include a short reason derived from the thrown error (safe to display), while keeping sanitized filenames based on the chapter title.

**User-visible outcome:** From the chapter editor, users can export a chapter to a properly downloaded .pdf or .docx (even if the chapter is empty), with embedded images when present, and see a clear English error message when export fails.
