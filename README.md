# World-Class Brief Intake Tool

This repository contains a single-page, front-end application that helps advertising teams guide clients through a structured, world-class creative brief. It runs entirely in the browser—no server setup is required.

## Features

- **Secure client entry**: lightweight workspace sign-in with persistent sessions stored locally.
- **Step-by-step brief builder**: guided sections that follow a best-in-class agency template (project context, brand background, problem, objectives, audience, insight, SMP, deliverables, timeline, budget, tone, approvals, and more).
- **Smart guidance**: best-practice prompts for the Insight and Single-Minded Proposition fields to help clients write strong responses.
- **Autosave & progress**: real-time autosave to the browser with progress tracking across all fields.
- **File support**: upload assets, references, or timelines in every section (kept locally in the browser for privacy).
- **Live preview**: instantly updated preview formatted for stakeholder reviews.
- **Export & sharing**: print-ready PDF via browser print, Microsoft Word/Google Docs export (`.doc`), Notion-ready Markdown export, plus secure share-link generation for collaborators.
- **Responsive, branded UI**: polished interface with agency-quality styling and dark-mode aesthetic.

## Getting started

No build tooling is required. Simply open `index.html` in a modern browser (Chrome, Edge, Firefox, or Safari) to launch the experience.

If you prefer to serve it locally (recommended for full functionality with file downloads), run a simple static server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080` in your browser.

## Development notes

- All data persists to `localStorage` under a workspace-specific key so each client session stays isolated.
- Uploaded files are stored as Base64-encoded strings in the browser; clear the session (sign out) to remove them from the device.
- The export buttons generate downloads client-side—no assets are transmitted to external servers.

## Browser support

The tool targets evergreen browsers. For best results ensure JavaScript is enabled and third-party cookie blockers permit `localStorage` access.
