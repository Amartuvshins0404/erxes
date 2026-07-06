# Dogfood QA Report — erxes AI Agent Chat (Conversation Management)

- Target: http://localhost:3001/erxes-agent/chat
- Date: 2026-07-01
- Focus: conversation management (create, switch, rename, delete, reload, empty states, deep-link)

## Summary
- critical: 0
- high: 0
- medium: 0
- low: 0

(counts updated at end)

---

## Issues

### CONVO-001: Conversations never auto-title — history fills with identical "New chat" rows
- Severity: high
- Category: functional / ux
- URL: http://localhost:3001/erxes-agent/chat/gRjOfKOIKbcVoFDmnGp6V

Description: Creating a new chat and sending a full user↔assistant exchange does NOT
generate a sensible title. The session stays as the literal placeholder "New chat"
permanently. Many sessions behave this way, so the SESSIONS list becomes a wall of
indistinguishable "New chat" rows (6+ observed for a single agent) — impossible to
find a past conversation. Expected: auto-title from the first user message (some
older sessions ARE named, e.g. "13 times 4 answer", "Initial chat exchange", so the
feature exists but is not firing for new chats).

Repro:
1. Open agent "Amaraa test" → click "+" → new session titled "New chat". (new-chat-empty.png)
2. Send "What is the capital of France? One word answer." → agent replies "Paris".
   Sidebar row STILL titled "New chat". (msg1-sent.png)
3. Observe: multiple identical "New chat" rows; Paris exchange never re-titles. (newchat-top1.png)

---

### CONVO-002: Model badge shows the same model twice ("kimi-for-coding · kimi-for-coding")
- Severity: low
- Category: visual / content
- URL: http://localhost:3001/erxes-agent/chat/gRjOfKOIKbcVoFDmnGp6V

Description: On the new-chat empty state, the model pill renders the model name
duplicated, separated by a middot: "kimi-for-coding · kimi-for-coding". Looks like a
main/fallback model pair where both resolve to the same value and are shown redundantly.

Repro:
1. Open agent "Amaraa test", start new chat — empty state. (new-chat-empty.png)
2. Observe badge under agent name: "kimi-for-coding · kimi-for-coding".

---

### CONVO-003: URL never reflects the active conversation — deep-linking to a conversation is impossible
- Severity: medium
- Category: functional / ux
- URL: http://localhost:3001/erxes-agent/chat/7jbIfnRlJACLenx4zhgh0

Description: The `/chat/<id>` URL segment corresponds to the AGENT, not the
conversation. Switching between different conversations of the same agent never
changes the URL. Verified two DISTINCT conversations of test-agent-4 ("Say hello in
one word" and "Simple Greeting Request" / Roman-Empire thread) both show the exact
same URL `.../chat/7jbIfnRlJACLenx4zhgh0`. Consequences: you cannot copy a link to a
specific conversation, browser back/forward can't move between conversations, and a
reload/deep-link cannot restore the exact conversation the user was viewing (see
CONVO-006). Expected: conversation id in the URL so conversations are addressable.

Repro:
1. Open test-agent-4, click session "Say hello in one word" → URL = .../7jbIfnRlJACLenx4zhgh0. (t4-sayhello-loaded.png)
2. Click session "Simple Greeting Request" (different conversation) → URL STILL .../7jbIfnRlJACLenx4zhgh0. (t4-simplegreeting.png)

---

### CONVO-004: Conversation titles are stale — long multi-topic threads keep their first-message title
- Severity: low
- Category: content / ux
- URL: http://localhost:3001/erxes-agent/chat/7jbIfnRlJACLenx4zhgh0

Description: A conversation is titled once from its first exchange and never updated.
The session titled "Simple Greeting Request" actually contains "say hi" → coffee
essay → full Roman-Empire essay. The title no longer represents the thread, making
the history list misleading. (Combined with CONVO-001, titling is unreliable both
ways: some threads never get a title, others keep an outdated one.)

Repro:
1. Open test-agent-4 → click "Simple Greeting Request".
2. Observe the thread contains a 1500-year Roman-Empire essay, unrelated to the title. (t4-simplegreeting.png)

---

### CONVO-005: Selecting an agent can drop the user straight into full-screen Voice mode
- Severity: medium
- Category: functional / ux
- URL: http://localhost:3001/erxes-agent/chat/7jbIfnRlJACLenx4zhgh0

Description: Selecting the "test-agent-4" agent from the agents list opened a
full-screen Voice-mode overlay ("Tap to speak") on top of a restored conversation,
without the user asking for voice. The overlay obscures the entire chat and must be
manually exited ("Exit voice mode") to read/continue the conversation. Selecting an
agent should land on the text chat, not voice capture. Also the voice overlay mixes
languages (Mongolian instruction "Микрофоныг дараад яриагаа эхлүүлээрэй" + English
"Tap to speak").

Repro:
1. From the agents list, click "test-agent-4".
2. Observe: full-screen voice overlay appears unprompted, mixed-language text. (agent2-sessions.png)

---
