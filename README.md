 ScamShield: Multilingual Scam Detection Tool

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🛡️ Overview

ScamShield is a powerful, AI-powered web application designed to protect users from online scams through advanced detection techniques across multiple languages. It analyzes URLs, text messages, and voice notes to identify potential threats, providing detailed explanations of its assessments.

![ScamShield Screenshot](screenshot.png)

## ✨ Features

- **Multiple Detection Methods**:
  - 🔗 URL Analysis: Scan links for suspicious patterns and potential phishing attempts
  - 📝 Text Analysis: Examine messages for scam indicators in multiple languages
  - 🎤 Voice Note Analysis: Transcribe and analyze spoken content for fraud attempts

- **Advanced AI Integration**:
  - 🧠 Google Gemini AI-powered verification
  - ⚡ Real-time threat assessment
  - 🔍 Detailed justifications for each analysis
  - 💬 Interactive follow-up questions about analysis results

- **Multilingual Support**:
  - 🇺🇸 English
  - 🇪🇸 Spanish
  - 🇫🇷 French
  - 🇩🇪 German
  - ...
    

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Clone this repository
git clone https://github.com/yourusername/scamshield.git

# Navigate into the project directory
cd scamshield

# Install dependencies
npm install
# or
yarn install

# Start the development server
npm run dev
# or
yarn dev

Open your browser and visit http://localhost:5173
Configuration

To use all features, you'll need to configure your Google Gemini API key:

    Obtain an API key from Google AI Studio
    Add your key in the application settings
    Enable the Gemini integration for enhanced scam detection

🛠️ Tech Stack


    Frontend:
        React 18
        TypeScript
        Vite for fast development
        Tailwind CSS for styling
        shadcn/ui for UI components
        React Hook Form for form handling
        Zod for form validation
        Tanstack Query for API requests

    Integrations:
        Google Gemini AI API for advanced verification
        Text-to-speech capabilities

📋 Usage
URL Checker

Enter any URL to analyze it for potential threats. Our system evaluates the domain, path patterns, and known indicators of phishing or malicious websites.
Text Analyzer

Paste text message content to scan for common scam patterns. The system analyzes language, urgency indicators, requests for personal information, and other red flags.
Voice Note Analyzer

Upload a voice recording to have it transcribed and analyzed for potential scam content, bringing scam detection to audio content.
Analysis Results

Results are clearly displayed with:

    Risk level assessment (Safe, Suspicious, Scam)
    Detailed justification explaining the assessment
    Language detection
    Timestamp of the analysis
    Option to ask follow-up questions about the analysis

📖 API Documentation

For developers interested in integrating with our system:

// Example API call to analyze a URL
const analyzeUrl = async (url: string) => {
  const response = await fetch('/api/analyze/url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  return await response.json();
};

🔒 Privacy

This tool is designed with privacy in mind:

    No personal data is stored
    Analysis is performed locally when possible
    API integrations use secure, encrypted connections
    No usage tracking beyond anonymous statistics

🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

    Fork the project
    Create your feature branch (git checkout -b feature/amazing-feature)
    Commit your changes (git commit -m 'Add some amazing feature')
    Push to the branch (git push origin feature/amazing-feature)
    Open a Pull Request

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
🙏 Acknowledgements

    Google Gemini AI for providing the advanced verification capabilities
    Open source community for the various libraries and tools that made this project possible
    All contributors and testers who have helped improve ScamShield

Built with ❤️ to protect people from online scams
