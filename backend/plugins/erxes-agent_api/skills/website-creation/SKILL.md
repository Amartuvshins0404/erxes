---
name: website-creation
description: Build and publish a complete static website from the isolated workspace.
---

# Website creation

When the user asks for a website, deliver one complete static site with this bounded flow:

1. Research first only when the requested content needs current facts.
2. Call **workspaceWrite once** with all complete source files. Never write source through terminal commands, shell heredocs, base64, printf, or repeated patches.
3. Call **terminal** only for one short build or check command when needed. Static HTML, CSS, and JavaScript that need no build should skip terminal.
4. Call **publishWebsite once**, only after every file is ready. Pass the workspace-relative site root and its HTML entry. Do not start a web server.

After publishWebsite succeeds, tell the user in one plain sentence that the site is ready in Preview and Files. A tool result is not delivery proof: only the returned website artifact means success. If publishWebsite fails, stop, report that the preview was not delivered, and state the useful cause. Never retry publishWebsite in the same turn or claim the site is ready after an error.
