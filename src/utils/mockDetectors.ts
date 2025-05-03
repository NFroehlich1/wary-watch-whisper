
import { ScamResult, Language } from '../types';
import { detectTextLanguage } from './language';

export const mockUrlCheck = (url: string): ScamResult => {
  // Simple mock logic for demo purposes - only used as fallback now
  const isScam = url.includes('scam') || url.includes('phish');
  const isVerySuspicious = url.includes('verify') || url.includes('confirm') || url.includes('login');
  const isSuspicious = url.includes('buy') || url.includes('free') || url.includes('win');
  
  let riskLevel: 'scam' | 'suspicious' | 'safe' = 'safe';
  let justification = "This URL appears to be safe based on our analysis.";
  
  if (isScam) {
    riskLevel = 'scam';
    justification = "This URL contains known phishing patterns and has been flagged as malicious.";
  } else if (isVerySuspicious) {
    riskLevel = 'suspicious';
    justification = "This URL contains highly suspicious keywords often associated with phishing attempts. Exercise extreme caution.";
  } else if (isSuspicious) {
    riskLevel = 'suspicious';
    justification = "This URL contains suspicious keywords often associated with scams. Proceed with caution.";
  }
  
  return {
    riskLevel,
    justification,
    detectedLanguage: 'en',
    originalContent: url,
    timestamp: new Date().toISOString(),
    confidenceLevel: isScam || !isSuspicious && !isVerySuspicious ? 'high' : 'medium'
  };
};

export const mockTextCheck = (text: string, language?: Language): ScamResult => {
  // Always use the detectTextLanguage function from utils to detect the language
  const detectedLanguage = detectTextLanguage(text);
  
  // Simple mock logic for demo purposes - only used as fallback now
  const isScam = text.toLowerCase().includes('password') || 
                text.toLowerCase().includes('credit card') || 
                text.toLowerCase().includes('urgently') ||
                text.toLowerCase().includes('contraseña') || 
                text.toLowerCase().includes('mot de passe') ||
                text.toLowerCase().includes('passwort');
  
  // Additional highly suspicious keywords              
  const isVerySuspicious = text.toLowerCase().includes('verify account') ||
                         text.toLowerCase().includes('suspicious activity') ||
                         text.toLowerCase().includes('limited access') ||
                         text.toLowerCase().includes('bestätigen sie ihr konto') || 
                         text.toLowerCase().includes('verdächtige aktivität') ||
                         text.toLowerCase().includes('verifique su cuenta') ||
                         text.toLowerCase().includes('vérifier votre compte');
                
  const isSuspicious = text.toLowerCase().includes('money') || 
                      text.toLowerCase().includes('bank') || 
                      text.toLowerCase().includes('click') ||
                      text.toLowerCase().includes('dinero') ||
                      text.toLowerCase().includes('argent') ||
                      text.toLowerCase().includes('geld');
  
  let riskLevel: 'scam' | 'suspicious' | 'safe' = 'safe';
  
  if (isScam) {
    riskLevel = 'scam';
  } else if (isVerySuspicious) {
    riskLevel = 'suspicious'; // Same level but different justification
  } else if (isSuspicious) {
    riskLevel = 'suspicious';
  }
  
  return {
    riskLevel,
    justification: getJustification(isScam, isVerySuspicious, isSuspicious, detectedLanguage),
    detectedLanguage,
    originalContent: text,
    timestamp: new Date().toISOString(),
    confidenceLevel: isScam ? 'high' : isVerySuspicious ? 'high' : isSuspicious ? 'medium' : 'high'
  };
};

export const mockVoiceCheck = (): ScamResult => {
  // For demo purposes, we're using a fixed result
  // In a real app, this would use speech-to-text and then analyze the text
  return {
    riskLevel: 'suspicious',
    justification: "The voice message contains urgent requests for financial information, which is a common scam tactic.",
    detectedLanguage: 'en',
    originalContent: "Voice transcription would appear here in a real implementation.",
    timestamp: new Date().toISOString()
  };
};

export const getJustification = (isScam: boolean, isVerySuspicious: boolean, isSuspicious: boolean, language: Language): string => {
  if (language === 'es') {
    if (isScam) return "Este mensaje solicita información personal sensible, lo cual es una táctica común de estafa.";
    if (isVerySuspicious) return "Este mensaje contiene palabras clave muy sospechosas relacionadas con el phishing. Extreme la precaución.";
    if (isSuspicious) return "Este mensaje contiene palabras clave sospechosas. Proceda con precaución.";
    return "Este mensaje parece seguro según nuestro análisis.";
  } else if (language === 'fr') {
    if (isScam) return "Ce message demande des informations personnelles sensibles, ce qui est une tactique d'arnaque courante.";
    if (isVerySuspicious) return "Ce message contient des mots-clés très suspects liés au phishing. Faites preuve d'une extrême prudence.";
    if (isSuspicious) return "Ce message contient des mots-clés suspects. Procédez avec prudence.";
    return "Ce message semble sécurisé selon notre analyse.";
  } else if (language === 'de') {
    if (isScam) return "Diese Nachricht fordert sensible persönliche Informationen an, was eine übliche Betrugsmasche ist.";
    if (isVerySuspicious) return "Diese Nachricht enthält sehr verdächtige Schlüsselwörter im Zusammenhang mit Phishing. Seien Sie äußerst vorsichtig.";
    if (isSuspicious) return "Diese Nachricht enthält verdächtige Schlüsselwörter. Bitte seien Sie vorsichtig.";
    return "Diese Nachricht scheint laut unserer Analyse sicher zu sein.";
  } else {
    if (isScam) return "This message requests sensitive personal information, which is a common scam tactic.";
    if (isVerySuspicious) return "This message contains highly suspicious keywords related to phishing. Exercise extreme caution.";
    if (isSuspicious) return "This message contains suspicious keywords. Proceed with caution.";
    return "This message appears to be safe based on our analysis.";
  }
};
