<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1HVEm7GamiklCVoI4kH02XvGIUXSw3ba0

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend API

A lightweight Express backend is included to persist data outside the browser. Run it locally with:

```
npm run server
```

The server listens on port `4000` by default and exposes REST endpoints under `/api` for transactions, categories, goals, subscriptions, debts, and user settings.
