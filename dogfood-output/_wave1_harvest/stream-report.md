# erxes AI Agent — Chat Streaming & Generation Dogfood Report

- **Target:** http://localhost:3001/erxes-agent/chat
- **Agent used:** test-agent-4 (opencode-go · glm-5.1), also Amaraa/kimi where noted
- **Date:** 2026-07-01
- **Focus:** streaming, generation, stop/cancel, concurrent sends, race conditions, ordering

## Severity counts
- critical: 0
- high: 0
- medium: 0
- low: 0

---

## Issues

### STREAM-001 — Stop/Cancel button does not actually stop generation (backend keeps running to completion) [high]
- **Category:** Functional
- **Agent:** test-agent-4 (glm-5.1)
- **What happens:** Clicking the Stop button (the square button that replaces Send during streaming) halts the *client-side* display only. The backend continues generating the full response. After a page reload, the "stopped" message shows the COMPLETE response, not the partial that was on screen when Stop was pressed.
- **Evidence (2 independent repros):**
  1. Asked for "numbers 1 to 200, each with a fun fact." Stopped mid-stream at #122 (`step2b-stopped.png` shows partial ending at 122). After reload the message is complete through #200 ("That's all 200!") — see `issue-stop-backend-roman.png` top.
  2. Asked for a "3000-word Roman Empire essay." Clicked Stop during the Thinking phase → UI showed NO assistant response at all (`step2-stop-after.png`). After reload the message is a full multi-section essay — see `issue-stop-backend-roman.png` bottom and snapshot headings "The Entire History of the Roman Empire".
- **Repro steps:**
  1. Select test-agent-4, send a prompt that yields a long answer.
  2. While streaming, click the Stop button; note stream halts on screen.
  3. Reload the page and reopen the same session.
  4. The message contains the FULL completed response, proving generation never stopped server-side.
- **Impact:** Misleading control; wastes model tokens/compute after user cancels; "cancelled" content silently reappears. Users cannot truly cancel a runaway/expensive generation.
- **Video:** /home/darjs/dev/os/erxes/dogfood-output/stream/videos/issue-stop-button.webm
- **Screenshots:** step2b-stopped.png, step2-stop-after.png, issue-stop-backend-roman.png, reload-persist.png

### STREAM-002 — Stopping during the "Thinking" phase leaves a dangling user message with no assistant bubble and no "stopped" feedback [medium]
- **Category:** UX
- **Agent:** test-agent-4 (glm-5.1)
- **What happens:** If Stop is pressed before any tokens render (while the "Working… / Thinking…" indicator is showing), the assistant bubble disappears entirely. The user is left with only their own message, no partial reply, and no indicator that generation was stopped/interrupted. (Compare: stopping mid-text does keep a coherent partial.)
- **Evidence:** `step2-stop-after.png` and `step2-stop-after-scroll.png` — Roman Empire user message with nothing after it. (Note: per STREAM-001 the reply was actually still generating in the background.)
- **Repro steps:**
  1. Send a prompt to test-agent-4.
  2. As soon as "Thinking…" appears (before text), click Stop.
  3. Observe: no assistant bubble, no "generation stopped" message, no partial.
- **Impact:** User gets no feedback and may think the agent failed or ignored them.
- **Screenshots:** step2-stop-after.png, step2-stop-after-scroll.png

### STREAM-003 — Reload drops the open agent/session (returns to "Select an agent") [low]
- **Category:** UX / State
- **What happens:** Reloading the chat page always returns to the empty "Select an agent" screen; the previously open agent and session are not restored (URL stays `/erxes-agent/chat` with no session id).
- **Evidence:** `after-reload.png`
- **Impact:** Loses context on refresh; user must re-navigate every reload.
