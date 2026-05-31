# Nudge — Silent AI for Students

> A real-time, invisible AI co-pilot for college students in online classes.

![Nudge Demo](https://img.shields.io/badge/status-live-4ade80?style=flat-square&labelColor=0f0f0f)
![Built with React](https://img.shields.io/badge/react-18-61dafb?style=flat-square&labelColor=0f0f0f)
![Powered by Claude](https://img.shields.io/badge/AI-Claude-cc785c?style=flat-square&labelColor=0f0f0f)

## What is Nudge?

Nudge sits silently while you're in an online lecture. It listens to what your professor says, and when you need help, it whispers the right answer — instantly, invisibly, without breaking your focus.

No switching tabs. No Googling mid-lecture. Just a quiet nudge when you need it.

## Features

- **Live transcription** — Captures what your professor says in real-time using the Web Speech API
- **Explain mode** — Simplifies the last concept into plain English instantly
- **Catch up mode** — Summarizes everything covered so far in 3 bullet points
- **Flag mode** — Bookmarks the most important moment with a timestamp
- **Invisible overlay** — Minimal dark UI designed to sit alongside your Zoom or Meet window without distraction

## Why I Built This

Students in online classes have no support system during the lecture itself. You can Google after, you can ask later — but in the moment, when the professor says something you don't understand, you're on your own.

Nudge fixes that. It's Cluely's "real-time invisible assist" applied to the student use case — a massive, underserved market.

## Tech Stack

- **Frontend** — React + Vite + Tailwind CSS
- **AI** — Anthropic Claude API (claude-haiku)
- **Transcription** — Web Speech API (browser-native, zero latency)
- **Backend** — Vercel serverless functions
- **Deployment** — Vercel

## Live Demo

👉 [nudgecluely-5z7esn8ku-vamshi-s-projects7.vercel.app](https://nudgecluely-5z7esn8ku-vamshi-s-projects7.vercel.app)

## How to Use

1. Open the app alongside your Zoom or Google Meet window
2. Click **start** — Nudge begins listening
3. Let your professor talk
4. When you need help, click:
   - **explain** — get a simple breakdown of what was just said
   - **catch up** — get a summary of everything so far
   - **flag** — bookmark this moment as important

## Running Locally

```bash
git clone https://github.com/vamshii5082/nudgecluely
cd nudgecluely
npm install
```

Create a `.env` file:
```
ANTHROPIC_API_KEY=your_key_here
```

```bash
npm run dev
```

## What's Next

- Chrome extension for true invisible overlay
- Auto-detection of important moments without clicking
- Post-lecture summary export
- Support for uploaded lecture slides as context
