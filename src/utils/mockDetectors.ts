
import { ScamResult, Language } from '../types';
import { detectTextLanguage } from './language';

export const mockUrlCheck = (url: string): ScamResult => {
  // Primary check: Is the URL using HTTP instead of HTTPS?
  const isUsingHttp = url.toLowerCase().startsWith('http:') && !url.toLowerCase().startsWith('https:');
  
  // Secondary checks for other suspicious patterns - require more evidence to flag as suspicious
  const isScam = url.includes('scam') || url.includes('phish');
  const isVerySuspicious = (url.includes('verify') && url.includes('login') && url.includes('urgent'));
  const isSuspicious = (url.includes('buy') && url.includes('free') && url.includes('urgent')) || 
                       (url.includes('win') && url.includes('now') && url.includes('money'));
  
  let riskLevel: 'scam' | 'suspicious' | 'safe' = 'safe';
  let justification = "This URL appears to be safe as it uses HTTPS.";
  
  if (isScam) {
    riskLevel = 'scam';
    justification = "This URL contains known phishing patterns and has been classified as malicious.";
  } else if (isUsingHttp && isVerySuspicious) {
    // Only flag HTTP as suspicious if it also contains multiple suspicious elements
    riskLevel = 'suspicious';
    justification = "This URL uses HTTP instead of HTTPS and contains suspicious keywords. HTTP connections are not secure and can be intercepted.";
  } else if (isVerySuspicious) {
    riskLevel = 'suspicious';
    justification = "This URL contains highly suspicious keywords that are often associated with phishing attempts. Exercise extreme caution.";
  } else if (isSuspicious && isUsingHttp) {
    // Multiple indicators must be present
    riskLevel = 'suspicious';
    justification = "This URL contains suspicious keywords and uses insecure HTTP. Please proceed with caution.";
  }
  
  return {
    riskLevel,
    justification,
    detectedLanguage: 'en',
    originalContent: url,
    timestamp: new Date().toISOString(),
    confidenceLevel: isScam ? 'high' : isVerySuspicious ? 'high' : isSuspicious ? 'medium' : 'high'
  };
};

export const mockTextCheck = (text: string, language?: Language): ScamResult => {
  // Always use the detectTextLanguage function from utils to detect the language
  const detectedLanguage = detectTextLanguage(text);
  
  // Check for common greeting patterns that should always be considered safe
  const isSimpleGreeting = /^(hello|hi|hey|good morning|good afternoon|good evening|how are you|nice to (meet|chat)|greetings)/i.test(text.toLowerCase());
  
  // If it's a simple greeting, return safe immediately without further checks
  if (isSimpleGreeting) {
    return {
      riskLevel: 'safe',
      justification: "This is a standard greeting message and appears to be safe.",
      detectedLanguage,
      originalContent: text,
      timestamp: new Date().toISOString(),
      confidenceLevel: 'high'
    };
  }
  
  // More strict criteria for flagging content - requiring combinations of suspicious elements
  const hasPasswordRequest = text.toLowerCase().includes('password') || 
                            text.toLowerCase().includes('contraseña') || 
                            text.toLowerCase().includes('mot de passe') ||
                            text.toLowerCase().includes('passwort');
  
  const hasCreditCardRequest = text.toLowerCase().includes('credit card') || 
                              text.toLowerCase().includes('tarjeta de crédito') ||
                              text.toLowerCase().includes('carte de crédit') ||
                              text.toLowerCase().includes('kreditkarte');
  
  const hasUrgency = text.toLowerCase().includes('urgently') ||
                    text.toLowerCase().includes('urgent') ||
                    text.toLowerCase().includes('urgente') ||
                    text.toLowerCase().includes('dringend');
  
  // Combined checks for more accurate classification - require multiple indicators
  const isScam = (hasPasswordRequest && hasCreditCardRequest && hasUrgency);
              
  const isVerySuspicious = (text.toLowerCase().includes('verify account') && text.toLowerCase().includes('click') && hasUrgency) ||
                         (text.toLowerCase().includes('suspicious activity') && text.toLowerCase().includes('login') && hasUrgency) ||
                         (text.toLowerCase().includes('bestätigen sie ihr konto') && text.toLowerCase().includes('klicken') && hasUrgency) || 
                         (text.toLowerCase().includes('verdächtige aktivität') && text.toLowerCase().includes('anmelden') && hasUrgency) ||
                         (text.toLowerCase().includes('verifique su cuenta') && text.toLowerCase().includes('clic') && hasUrgency) ||
                         (text.toLowerCase().includes('vérifier votre compte') && text.toLowerCase().includes('cliquez') && hasUrgency);
                
  const isSuspicious = (text.toLowerCase().includes('money') && text.toLowerCase().includes('bank') && text.toLowerCase().includes('click')) ||
                      (text.toLowerCase().includes('dinero') && text.toLowerCase().includes('banco') && text.toLowerCase().includes('clic')) ||
                      (text.toLowerCase().includes('argent') && text.toLowerCase().includes('banque') && text.toLowerCase().includes('cliquez')) ||
                      (text.toLowerCase().includes('geld') && text.toLowerCase().includes('bank') && text.toLowerCase().includes('klicken'));
  
  let riskLevel: 'scam' | 'suspicious' | 'safe' = 'safe';
  
  if (isScam) {
    riskLevel = 'scam';
  } else if (isVerySuspicious) {
    riskLevel = 'suspicious'; // Same level but different justification
  } else if (isSuspicious && hasUrgency) {
    // Require both suspicious content AND urgency to flag as suspicious
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
