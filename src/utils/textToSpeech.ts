
import { ScamResult, Language } from '../types';

export const playAudioFromResult = (result: ScamResult, onEnd: () => void): void => {
  const speech = new SpeechSynthesisUtterance();
  
  // Set language based on detection
  switch(result.detectedLanguage) {
    case 'es':
      speech.lang = 'es-ES';
      break;
    case 'fr':
      speech.lang = 'fr-FR';
      break;
    case 'de':
      speech.lang = 'de-DE';
      break;
    default:
      speech.lang = 'en-US';
  }
  
  // Generate the appropriate verdict text
  const verdictText = getVerdictText(result.riskLevel, result.confidenceLevel, result.detectedLanguage);
  
  speech.text = `${verdictText}. ${result.justification}`;
  speech.onend = onEnd;
  
  window.speechSynthesis.speak(speech);
};

export const getVerdictText = (riskLevel: string, confidenceLevel?: string, language?: Language): string => {
  // Special handling for high suspicion (suspicious with high confidence)
  const isHighSuspicion = riskLevel === 'suspicious' && confidenceLevel === 'high';
  
  if (language === 'es') {
    if (riskLevel === 'scam') return "Estafa detectada";
    if (isHighSuspicion) return "Alto nivel de sospecha";
    if (riskLevel === 'suspicious') return "Contenido sospechoso";
    return "Contenido seguro";
  } else if (language === 'fr') {
    if (riskLevel === 'scam') return "Arnaque détectée";
    if (isHighSuspicion) return "Niveau élevé de suspicion";
    if (riskLevel === 'suspicious') return "Contenu suspect";
    return "Contenu sécurisé";
  } else if (language === 'de') {
    if (riskLevel === 'scam') return "Betrug erkannt";
    if (isHighSuspicion) return "Hoher Verdachtsgrad";
    if (riskLevel === 'suspicious') return "Verdächtiger Inhalt";
    return "Sicherer Inhalt";
  } else {
    if (riskLevel === 'scam') return "Scam detected";
    if (isHighSuspicion) return "High suspicion detected";
    if (riskLevel === 'suspicious') return "Suspicious content";
    return "Safe content";
  }
};
