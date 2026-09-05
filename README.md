# LootLedger

**A specialized, full-stack intelligence and valuation command center for resellers, thrift sourcers, and antique dealers.**

LootLedger is an end-to-end PWA (Progressive Web App) leveraging Google's Gemini models to instantly identify objects from a photo, analyze their market value, calculate the expected net profit after fees, and provide a staging/listing plan.

---

## 📚 Executive Documentation

For the "God Tier" production rollout, all strategic blueprints and instructions have been packaged into the `docs/` directory:

1. **[Market Research & Business Plan](./docs/BUSINESS_PLAN.md)**: Details the $42B market, the exact problem/solution matrix, freemium tiering, unit economics, and a viral TikTok Go-To-Market strategy.
2. **[Architecture Blueprint](./docs/ARCHITECTURE_BLUEPRINT.md)**: A technical teardown of the Intelligence Pipeline, the Firebase Security Layer, the PWA implementation, and the custom 3D Neo-Brutalist CSS system.
3. **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)**: Step-by-step instructions for separating the frontend (Vercel) and backend (Cloud Run), securing API keys, and setting up Stripe billing.

## 🚀 Running Locally

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Set up your `.env` variables (refer to `.env.example`). You must provide `GEMINI_API_KEY` and Firebase credentials to unlock full functionality.
3. Start the development server:
   ```bash
   npm run dev
   ```
4. To build for production:
   ```bash
   npm run build && npm start
   ```
