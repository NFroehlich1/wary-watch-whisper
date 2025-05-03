
# 🛡️ ScamShield — Multilingual Scam Detection Tool

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-darkgreen.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Table of Contents
1. [Overview](#overview)  
2. [Features](#features)  
3. [Tech Stack](#tech-stack)  
4. [Getting Started](#getting-started)  
   1. [Prerequisites](#prerequisites)  
   2. [Installation](#installation)  
   3. [Configuration](#configuration)  
5. [Usage](#usage)  
6. [API Reference](#api-reference)  
7. [Backend Structure](#backend)
8. [Privacy](#privacy)  
9. [Contributing](#contributing)  
10. [License](#license)  
11. [Acknowledgements](#acknowledgements)

---

## 🏷️ Overview <a name="overview"></a>

ScamShield is an AI‑powered web application that protects users from online scams in **multiple languages**.  
It analyzes:

* 🔗 **URLs**  
* 📝 **Text messages**  
* 🎤 **Voice notes**

and returns a detailed, transparent assessment of potential threats.

<p align="center">
  <img src="screenshot.png" alt="ScamShield screenshot" width="700"/>
</p>

---

## ✨ Features <a name="features"></a>

| Category | Details |
|----------|---------|
| **Detection** | • URL analysis<br>• Text analysis<br>• Voice‑note analysis |
| **AI** | • Google Gemini‑powered verification<br>• Real‑time threat scores<br>• Human‑readable justifications<br>• Interactive follow‑up Q&A |
| **Languages** | English, Spanish, French, German, and more |
| **Results** | • Risk level (Safe / Suspicious / Scam)<br>• Explanation<br>• Detected language<br>• Timestamp<br>• "Ask again" option |
| **Security** | • Serverless edge functions<br>• API key protection<br>• CORS policies<br>• Error handling |

---

## 🛠️ Tech Stack <a name="tech-stack"></a>

### Front‑end
* **React 18** + **Vite** (fast dev & HMR)  
* **TypeScript**  
* **Tailwind CSS** for styling  
* **shadcn/ui** components  
* **React‑Hook‑Form** + **Zod** for form validation  
* **TanStack Query** for data‑fetching & caching  
* **React Router** for navigation

### Backend & Infrastructure
* **Supabase** — Backend-as-a-Service platform
* **Supabase Edge Functions** — Serverless Deno runtime
* **Google Gemini API** — Advanced content verification
* **CORS** — Cross-Origin Resource Sharing protection
* **Environment Secrets** — Secure API key management

### Integrations
* **Google Gemini AI API** — advanced content verification  
* **Web Speech API** — text‑to‑speech / speech‑to‑text  
* **Sonner** — Toast notifications
* **TanStack Query** — Data fetching with caching

---

## 🚀 Getting Started <a name="getting-started"></a>

### Prerequisites <a name="prerequisites"></a>

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | ≥ 16.18.0 | Tested on LTS 16 & 18 |
| **npm** / **pnpm** / **yarn** | latest | Use your preferred package manager |
| **Supabase CLI** | latest | Optional, for local development |

> **Important**   
> Node 14 and earlier are **not** supported due to optional‑chaining syntax and native ES‑modules in dependencies.

### Installation <a name="installation"></a>

```bash
# 1. Clone
git clone https://github.com/yourusername/scamshield.git
cd scamshield

# 2. Install dependencies
npm ci          # npm
# or
yarn install    # yarn
# or
pnpm install    # pnpm

# 3. Start dev server
npm run dev
# or
yarn dev
```

Visit **http://localhost:5173** (default Vite port).

### Configuration <a name="configuration"></a>

Create a `.env.local` in the project root (never commit this file):

```env
# .env.local
VITE_GEMINI_API_KEY=your_google_gemini_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

| Variable | Purpose |
|----------|---------|
| `VITE_GEMINI_API_KEY` | Required for AI verification. Get one from [Google AI Studio](https://aistudio.google.com). |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

For Supabase Edge Functions, set the following secrets:

```bash
supabase secrets set GEMINI_API_KEY=your_google_gemini_key
```

* No other environment variables are required for dev/test.  
* **Never** overwrite `.env` files in CI/prod without explicit confirmation (see CONTRIBUTING).

---

## 📋 Usage <a name="usage"></a>

1. **URL Checker** — paste any link to scan domain, path patterns, and phishing markers.  
2. **Text Analyzer** — drop a message; we flag urgency cues, data‑harvest attempts, etc.  
3. **Voice Note Analyzer** — upload audio (FLAC / WAV / MP3). We transcribe and analyze the text.  

Results include:

* Risk level badge  
* Reasoning (bullet list)  
* Detected language code  
* ISO‑8601 timestamp  
* "Ask follow‑up" chat entry

---

## 📖 API Reference <a name="api-reference"></a>

Base URL: `/api`

```ts
// POST /api/analyze/url
type AnalyzeUrlBody = { url: string };
type AnalyzeResponse = {
  risk: 'safe' | 'suspicious' | 'scam';
  details: string[];
  language: string;
  analyzedAt: string; // ISO‑8601
};

export async function analyzeUrl(url: string) {
  const res = await fetch('/api/analyze/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url } satisfies AnalyzeUrlBody),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<AnalyzeResponse>;
}
```

> Further endpoints: `/api/analyze/text`, `/api/analyze/voice` — see `docs/api.md`.

---

## 🖥️ Backend Structure <a name="backend"></a>

### Edge Functions

ScamShield utilizes Supabase Edge Functions for secure, serverless backend operations:

| Function | Purpose | Technology |
|----------|---------|------------|
| **secure-gemini** | AI content verification | Deno + Google Gemini API |
| **speech-to-text** | Voice transcription | Deno + Web Speech API |
| **secure-storage** | Anonymized analytics | Supabase Storage |

### Security Features

- **API Key Protection**: All API keys are stored securely in Supabase secrets
- **Request Validation**: Input sanitization and validation before processing
- **CORS Policies**: Strict cross-origin policies to prevent unauthorized access
- **Error Handling**: Comprehensive error handling and logging
- **Rate Limiting**: Protection against abuse through request rate limiting

---

## 🔒 Privacy <a name="privacy"></a>

* **Zero** personal data retention — analyses are ephemeral unless the user opts in to save them.  
* Gemini calls are proxied through a secure backend; keys remain server‑side.  
* Only anonymous usage metrics (total scans, language distribution) are collected.  

---

## 🤝 Contributing <a name="contributing"></a>

1. **Fork** the repo  
2. `git checkout -b feat/my‑feature`  
3. Commit using **conventional commits**  
4. `git push origin feat/my‑feature`  
5. Open a **Pull Request**  

Please run:

```bash
npm run lint        # ESLint + Prettier
npm run test        # vitest
npm run typecheck   # tsc --noEmit
```

before submitting.

---

## 📄 License <a name="license"></a>

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for full text.

---

## 🙏 Acknowledgements <a name="acknowledgements"></a>

* **Google Gemini AI** — verification engine  
* **Supabase** — backend infrastructure and serverless functions
* **Deno** — secure runtime for edge functions
* The open‑source ecosystem (React, Vite, Tailwind, shadcn/ui, TanStack Query, Vitest)  
* Contributors and testers who help keep ScamShield sharp  

---

> Built with ❤️ to keep people safe from online scams in a world of ever-evolving threats.
