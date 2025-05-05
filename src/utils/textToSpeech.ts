
import { ScamResult, Language } from '../types';

export const playAudioFromResult = (result: ScamResult, onEnd: () => void): void => {
  const speech = new SpeechSynthesisUtterance();
  
  // Always use English
  speech.lang = 'en-US';
  
  // Generate the appropriate verdict text
  const verdictText = getVerdictText(result.riskLevel, result.confidenceLevel, 'en');
  
  let detailedText = "";
  
  // Create a more detailed explanation based on risk level
  if (result.riskLevel === 'scam') {
    detailedText = `This content was identified as a scam with high confidence. The analysis found: ${result.justification}`;
  } else if (result.riskLevel === 'suspicious' && result.confidenceLevel === 'high') {
    detailedText = `This content shows highly suspicious patterns that require caution. The analysis found: ${result.justification}`;
  } else if (result.riskLevel === 'suspicious') {
    detailedText = `This content contains some suspicious elements that warrant caution. The analysis found: ${result.justification}`;
  } else {
    detailedText = `This content appears safe based on our analysis. ${result.justification}`;
  }
  
  speech.text = `${verdictText}. ${detailedText}`;
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
