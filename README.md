# Hireable

An anonymous, evidence-first workspace for creating a better job application.

## Current MVP

- Paste a resume and job description
- See an explainable requirement-coverage check
- Review a tailored-resume starting point
- Generate a subject line and application email body
- Save application cards in browser-local storage

No account or profile is required. The local tracker is tied to the current browser.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Structure

- `app/` contains only routes and layout composition.
- `features/` owns each product capability and its logic.
- `components/ui/` is reserved for genuinely shared UI primitives as the app grows.
- `lib/` will hold cross-feature platform adapters (AI, database, storage, observability).

## Next integrations

The interface currently demonstrates the product flow locally. Production work will connect file parsing/OCR, structured AI calls, Cloudflare R2 storage, a Postgres data layer, queues, and sourced company research.
