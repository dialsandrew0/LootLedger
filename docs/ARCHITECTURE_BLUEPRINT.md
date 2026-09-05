# LootLedger: Architecture Blueprint

## Core Stack
- **Frontend:** React 18, Vite, Tailwind CSS 4
- **Backend:** Node.js, Express, esbuild
- **Database / Auth:** Firebase Firestore, Firebase Authentication (Google Sign-In)
- **AI Engine:** Google Gemini (`gemini-2.5-flash`) via `@google/genai` SDK
- **PWA:** `vite-plugin-pwa` for offline capability and native mobile/desktop installation.

## 1. The Intelligence Pipeline (Backend)
Located in `server.ts`. 
- **Endpoint:** `POST /api/appraise`
- **Flow:** Receives a Base64 image and optional user prompt. It constructs a massive, highly structured system prompt instructing the AI to act as a financial and antique appraiser.
- **Output:** It utilizes Gemini's `responseSchema` to guarantee a strict JSON output matching our `ValuationResult` TypeScript interface. This ensures the frontend never breaks trying to parse unstructured AI text.
- **Resilience:** Implements exponential backoff retries to gracefully handle HTTP 503 (High Demand) errors from the AI model.

## 2. The Persistence Pipeline (Firebase)
Located in `src/utils/inventory.ts` and `firestore.rules`.
- **Data Isolation:** Uses a subcollection architecture `users/{uid}/inventory/{itemId}`. 
- **Security:** `firestore.rules` guarantees that an authenticated user can only read, write, or delete documents inside their specific `{uid}` path.

## 3. The PWA Pipeline (Offline & Native)
Located in `vite.config.ts` and `src/hooks/usePWAInstall.ts`.
- **Service Worker:** Auto-generates a `sw.js` file that caches the DOM, CSS, Google Fonts, and JS bundles.
- **Installation:** Detects if the user is on iOS, Android, or Desktop and provides custom installation UI (e.g., prompting iOS users to use the Safari "Share" menu).

## 4. The "God Tier 3D" CSS System
Located in `src/index.css`.
- We abandoned generic SaaS glassmorphism for a high-contrast, physical Neo-Brutalist design.
- Uses `-webkit-text-stroke` for neon outlines and heavy `#050505` box-shadows.
- Interactive physics: `btn-3d-accent` physically depresses when clicked (`:active { transform: translate(2px, 2px); box-shadow: 0px 0px 0px }`), mimicking tactile hardware buttons.
