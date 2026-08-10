# Dogfood Report: erxes AI Agent — PPTX Artifacts

| Field | Value |
|-------|-------|
| **Date** | 2026-07-01 |
| **App URL** | http://localhost:3001/erxes-agent/chat |
| **Session** | pptx (agent-browser wrapper /tmp/abw-pptx) |
| **Scope** | PPTX artifact/preview system in chat |
| **Agent** | test-agent-4 (glm-5.1) |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Total** | **0** |

## Issues

### ISSUE-001: Emoji glyphs render as tofu boxes (□) in every rendered slide

| Field | Value |
|-------|-------|
| **Severity** | medium |
| **Category** | visual |
| **URL** | http://localhost:3001/erxes-agent/chat |
| **Repro Video** | N/A |

**Description**

The AI generated a 6-slide deck "All About Cats 🐱". Every emoji embedded in the slide content renders as a missing-glyph tofu box (□) in the rendered slide preview, Present mode, and Fullscreen mode. Examples: the title slide shows "All About Cats □" (should be 🐱); the "Popular Cat Breeds" slide shows a □ above each breed name (Persian, Maine Coon, Siamese, British Shorthair, Bengal, Scottish Fold); the "Cat Care Essentials" slide shows □ before Nutrition/Health/Enrichment/Affection; the closing slide shows "Cats Make Life Better □".

The same emoji renders correctly in the artifact HEADER title bar ("All About Cats 🐱") — so the bug is specific to the slide-rendering font/pipeline (the slide renderer's font stack has no emoji fallback), not the browser. This ships broken emojis into the downloaded .pptx too.

**Evidence**

- ![Title slide tofu](screenshots/fullscreen.png) — header shows 🐱, slide shows □
- ![Breed cards tofu](screenshots/present-arrowright.png) — □ above each breed name
- ![Care essentials tofu](screenshots/slide-scroll-1200.png) — □ before each label

---
