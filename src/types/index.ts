
export type Language = 'en' | 'es' | 'fr';

export type DetectionType = 'url' | 'text' | 'voice';

export type RiskLevel = 'safe' | 'suspicious' | 'scam';

export type ScamResult = {
  riskLevel: RiskLevel;
  justification: string;
  detectedLanguage: Language;
  originalContent: string;
  timestamp: string;
};
