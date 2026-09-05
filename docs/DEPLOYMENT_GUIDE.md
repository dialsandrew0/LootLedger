# LootLedger: Production Deployment Guide

This guide outlines exactly how to take this codebase from a ZIP file to a live, monetized production application on the open internet.

## Step 1: Secure Your API Keys
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and generate a production Gemini API Key.
2. Go to the [Firebase Console](https://console.firebase.google.com/), create a new project, and register a Web App to get your Firebase config block.

## Step 2: Configure Firebase Services
1. **Authentication:** In the Firebase Console, go to Authentication -> Sign-in method. Enable "Google".
2. **Firestore:** Go to Firestore Database. Click "Create database". Start in production mode.
3. **Deploy Rules:** You must apply the rules found in `firestore.rules` to your Firebase project. You can do this via the Firebase CLI (`firebase deploy --only firestore:rules`) or by pasting them directly into the "Rules" tab in the Firebase Console.

## Step 3: Frontend Deployment (Vercel or Netlify)
We recommend Vercel for the React frontend.
1. Push this repository to GitHub.
2. Import the repository into Vercel.
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. **Environment Variables:** Add your Firebase config variables (e.g., `VITE_FIREBASE_API_KEY`, etc.) inside the Vercel dashboard.

## Step 4: Backend Deployment (Google Cloud Run or Render)
Because this app uses a custom Express backend to hide the Gemini API key, it must be hosted on a Node.js server.
1. **Dockerfile:** Create a simple Node.js Dockerfile pointing to `dist/server.cjs`.
2. **Deploy to Cloud Run:** 
   - Connect your GitHub repo to Google Cloud Run.
   - Set the startup command to `node dist/server.cjs`.
   - **CRITICAL:** Add your `GEMINI_API_KEY` as a secret environment variable in the Cloud Run configuration. NEVER expose this in the frontend Vercel deployment.

## Step 5: Connecting the Front and Back Ends
1. Once your backend is deployed to Cloud Run, it will give you an API URL (e.g., `https://loot-api-xxx.run.app`).
2. Go back to Vercel and add an environment variable `VITE_API_URL` pointing to that Cloud Run URL.
3. Update `src/utils/appraise.ts` to `fetch(import.meta.env.VITE_API_URL + '/api/appraise')` instead of relative paths.

## Step 6: Stripe Monetization (Final Polish)
1. Create a [Stripe](https://stripe.com/) account.
2. Create a Product ("LootLedger Pro") and a Pricing plan ($14.99/mo).
3. Implement `@stripe/stripe-js` in the frontend to trigger a Checkout Session.
4. Add a Stripe Webhook endpoint to your `server.ts` that listens for `checkout.session.completed` and updates the user's `tier` field in Firestore.
