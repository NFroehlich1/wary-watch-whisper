
import { ScamResult, Language } from '../types';

export const playAudioFromResult = (result: ScamResult, onEnd: () => void): void => {
  const speech = new SpeechSynthesisUtterance();
  
  // Always use English
  speech.lang = 'en-US';
  
  // Generate the appropriate verdict text
  const verdictText = getVerdictText(result.riskLevel, result.confidenceLevel, 'en');
  
  speech.text = `${verdictText}. ${result.justification}`;
  speech.onend = onEnd;
  
  window.speechSynthesis.speak(speech);
};

export const getVerdictText = (riskLevel: string, confidenceLevel?: string, language?: Language): string => {
  // Special handling for high suspicion (suspicious with high confidence)
  const isHighSuspicion = riskLevel === 'suspicious' && confidenceLevel === 'high';
  
  // Always use English regardless of the language parameter
  if (riskLevel === 'scam') return "Scam detected";
  if (isHighSuspicion) return "High suspicion detected";
  if (riskLevel === 'suspicious') return "Suspicious content";
  return "Safe content";
};
