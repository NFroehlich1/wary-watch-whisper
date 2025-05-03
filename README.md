# 🛡️ ScamShield — Multilingual Scam Detection Tool

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.x-darkgreen.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Table of Contents
1. [Overview](#overview)  
2. [Features](#features)  
3. [Architecture](#architecture)
   1. [Frontend](#frontend)
   2. [Backend](#backend)
   3. [Security](#security)
   4. [Deployment Status](#deployment)
4. [Getting Started](#getting-started)  
   1. [Prerequisites](#prerequisites)  
   2. [Installation](#installation)  
   3. [Configuration](#configuration)  
5. [Usage](#usage)  
6. [API Reference](#api-reference)  
7. [Privacy](#privacy)  
8. [Contributing](#contributing)  
9. [License](#license)  
10. [Acknowledgements](#acknowledgements)

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
| **Security** | • Serverless edge functions<br>• Secure API key management<br>• CORS policies<br>• Error handling |

---

## 🏗️ Architecture <a name="architecture"></a>

ScamShield uses a modern client-server architecture with a clear separation between frontend and backend components.

### Frontend <a name="frontend"></a>

The client-side application is built with:

* **React 18** — Component-based UI library with Hooks API
* **Vite** — Next-generation frontend tooling with HMR and optimized build
* **TypeScript** — Static type-checking for enhanced code quality
* **Tailwind CSS** — Utility-first CSS framework
* **shadcn/ui** — Accessible and customizable component library
* **React Router** — Declarative routing for React applications
* **React Hook Form** + **Zod** — Form state management and validation
* **TanStack Query** — Data fetching, caching, and state synchronization
* **Sonner** — Toast notifications for user feedback

### Backend <a name="backend"></a>

Server-side operations are handled by:

* **Supabase Platform** — Backend-as-a-Service providing:
  * **Edge Functions** — Serverless Deno runtime for backend logic
  * **Secrets Management** — Secure storage for API keys and credentials
  * **Storage** — File storage capabilities for application assets
  * **Authentication** — (Prepared but not yet implemented)
  * **Database** — PostgreSQL database (Prepared but not yet implemented)

* **Edge Functions:**
  * **secure-gemini** — Proxies requests to Google Gemini AI, protecting API keys
  * **speech-to-text** — Handles voice transcription processing
  * **secure-storage** — Manages anonymized analytics data

* **External Services:**
  * **Google Gemini AI** — Powers the advanced content verification
  * **Web Speech API** — Provides text-to-speech and speech-to-text capabilities

### Security <a name="security"></a>

ScamShield employs a robust security architecture:

* **No API Keys in Client Code** — All sensitive API keys are stored as Supabase Secrets
* **Edge Function Proxies** — All external API calls are made via secure Supabase Edge Functions
* **Request Validation** — All incoming data is validated before processing
* **CORS Protection** — Proper headers prevent unauthorized cross-origin requests
* **Error Handling** — Failed API calls degrade gracefully without exposing sensitive information

### Deployment Status <a name="deployment"></a>

| Component | Status | Platform | URL |
|-----------|--------|----------|-----|
| **Frontend** | ✅ Live | Vercel | [scamshield.vercel.app](https://scamshield.vercel.app) |
| **Edge Functions** | ✅ Live | Supabase | Region: us-east-1 |
| **Database** | 🔄 Prepared | Supabase | - |
| **Authentication** | 🔄 Prepared | Supabase | - |
| **Storage** | ✅ Live | Supabase | - |

> **Note:** The application currently operates in a stateless mode, with prepared but not yet implemented database and authentication components.

---

## 🚀 Getting Started <a name="getting-started"></a>

### Prerequisites <a name="prerequisites"></a>

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | ≥ 16.18.0 | Tested on LTS 16 & 18 |
| **npm** / **pnpm** / **yarn** | latest | Use your preferred package manager |
| **Supabase CLI** | latest | Required for local development |

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
