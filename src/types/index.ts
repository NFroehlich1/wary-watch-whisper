
export type Language = 'en' | 'es' | 'fr' | 'de';

export type DetectionType = 'url' | 'text' | 'voice';

export type RiskLevel = 'safe' | 'suspicious' | 'scam';

export type ScamResult = {
  riskLevel: RiskLevel;
  justification: string;
  detectedLanguage: Language;
  originalContent: string;
  timestamp: string;
  aiVerification?: string; // Additional verification from Gemini AI
};

export type GeminiOptions = {
  apiKey: string;
  enabled: boolean;
};
