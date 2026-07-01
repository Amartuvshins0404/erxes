# Dogfood Report: erxes AI Agent — Chat Artifact/Preview (Charts + Mermaid + Documents)

| Field | Value |
|-------|-------|
| **Date** | 2026-07-01 |
| **App URL** | http://localhost:3001/erxes-agent/chat |
| **Session** | erxes-agent-chat (agent: Amaraa test, model kimi-for-coding) |
| **Scope** | Preview panel: kind=chart (ECharts), kind=diagram (Mermaid), kind=document. Charts + Mermaid focus. |

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 0 |
| **Total** | **0** |

## Notes / Baseline
- Preview panel is the "Files" panel (top-right "Files" button). Empty state: "No charts or documents yet. Ask the agent to chart data or generate a report." — clean empty state, OK.
- HTML/code confirmed inline-markdown only (no preview) — EXPECTED per product; out of scope, not filed.
- Copy-code button on inline code blocks works (icon → green check). Icon button is unlabeled (no aria-label) — minor a11y, noted.

## Issues

