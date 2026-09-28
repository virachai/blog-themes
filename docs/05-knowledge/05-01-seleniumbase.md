# SeleniumBase — Knowledge Base

Source: https://github.com/seleniumbase/SeleniumBase

> Reference material for the project. This document records architecture, concepts, and safe integration ideas; it is not a copy of the upstream repository.

## Purpose

SeleniumBase is a Python framework for browser automation and web testing. It provides higher-level APIs around Selenium and related browser automation workflows.

## Why it matters to this project

For the CDP Browser Runtime, SeleniumBase is useful as a reference for:

- Browser/session lifecycle patterns
- Explicit waits and synchronization
- Element discovery and interaction
- Test assertions and diagnostics
- Screenshot and browser-state capture
- Cross-browser automation concepts
- Handling pages that change dynamically

## CDP relationship

SeleniumBase and the project's native-CDP runtime solve overlapping browser-automation problems through different layers.

| SeleniumBase concept | CDP Runtime analogue |
|---|---|
| Browser/session management | CDP target discovery + WebSocket session |
| Element lookup | DOM queries / Runtime.evaluate |
| Waits | polling + state-machine transitions |
| Browser diagnostics | Runtime.evaluate + structured trace |
| Test flow | explicit runtime state machine |

Use SeleniumBase as a knowledge/reference layer rather than assuming its APIs are directly available in the Node-based CDP runtime.

## Security / challenge handling

Security challenges should be treated as explicit runtime states.

Recommended policy:

1. Detect challenge indicators.
2. Record provider and page context.
3. Capture diagnostics/screenshot where appropriate.
4. Stop automated interaction at the challenge boundary.
5. Request human completion when required.
6. Re-check page state after human completion.
7. Resume only after the challenge is cleared.

Do not use browser automation techniques to bypass CAPTCHA, anti-bot controls, or access restrictions.

## Useful concepts to study upstream

When reviewing the upstream project, focus on:

- Driver initialization and lifecycle
- Wait utilities
- Element APIs
- Page navigation
- Screenshot/diagnostic utilities
- CDP integration points
- Browser configuration
- Test organization
- Error handling and reporting

## Local project integration

Current related runtime artifacts:

- .tmp/cdp/chatjimmy/cdp-security.mjs
- .tmp/cdp/chatjimmy/cdp-chat-state.mjs
- .tmp/cdp/chatjimmy/security-handoff.json
- .tmp/cdp/chatjimmy/conversation.json

The knowledge document lives under docs/05-knowledge/ so external reference material follows the project's numbered documentation structure.

## Source

SeleniumBase GitHub repository:
https://github.com/seleniumbase/SeleniumBase

When using this document for implementation decisions, verify API details against the upstream repository and its current documentation.
