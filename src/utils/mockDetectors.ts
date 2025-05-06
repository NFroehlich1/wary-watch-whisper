
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
  let justification = "Diese URL scheint sicher zu sein, da sie HTTPS verwendet.";
  
  if (isScam) {
    riskLevel = 'scam';
    justification = "Diese URL enthält bekannte Phishing-Muster und wurde als bösartig eingestuft.";
  } else if (isUsingHttp && isVerySuspicious) {
    // Only flag HTTP as suspicious if it also contains multiple suspicious elements
    riskLevel = 'suspicious';
    justification = "Diese URL verwendet HTTP anstatt HTTPS und enthält verdächtige Schlüsselwörter. HTTP-Verbindungen sind nicht sicher und können abgefangen werden.";
  } else if (isVerySuspicious) {
    riskLevel = 'suspicious';
    justification = "Diese URL enthält sehr verdächtige Schlüsselwörter, die häufig mit Phishing-Versuchen verbunden sind. Seien Sie äußerst vorsichtig.";
  } else if (isSuspicious && isUsingHttp) {
    // Multiple indicators must be present
    riskLevel = 'suspicious';
    justification = "Diese URL enthält verdächtige Schlüsselwörter und verwendet unsicheres HTTP. Bitte seien Sie vorsichtig.";
  }
  
  return {
    riskLevel,
    justification,
    detectedLanguage: 'de',
    originalContent: url,
    timestamp: new Date().toISOString(),
    confidenceLevel: isScam ? 'high' : isVerySuspicious ? 'high' : isSuspicious ? 'medium' : 'high'
  };
};

export const mockTextCheck = (text: string, language?: Language): ScamResult => {
  // Always use the detectTextLanguage function from utils to detect the language
  const detectedLanguage = detectTextLanguage(text);
  
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

export const mockVoiceCheck = (transcription: string = ""): ScamResult => {
  // Enhanced voice analysis with specific check patterns
  const detectedLanguage = detectTextLanguage(transcription);
  
  // Voice-specific scam indicators
  const hasUrgency = transcription.toLowerCase().includes('urgent') || 
                    transcription.toLowerCase().includes('immediately') ||
                    transcription.toLowerCase().includes('right away') ||
                    transcription.toLowerCase().includes('emergency');
                    
  const hasPersonalInfoRequest = transcription.toLowerCase().includes('social security') ||
                                transcription.toLowerCase().includes('account number') ||
                                transcription.toLowerCase().includes('credit card') ||
                                transcription.toLowerCase().includes('password') ||
                                transcription.toLowerCase().includes('pin');
                                
  const hasThreat = transcription.toLowerCase().includes('arrest') ||
                   transcription.toLowerCase().includes('lawsuit') ||
                   transcription.toLowerCase().includes('police') ||
                   transcription.toLowerCase().includes('legal action');
                   
  const hasAuthority = transcription.toLowerCase().includes('irs') ||
                      transcription.toLowerCase().includes('bank') ||
                      transcription.toLowerCase().includes('microsoft') ||
                      transcription.toLowerCase().includes('tech support') ||
                      transcription.toLowerCase().includes('amazon');
  
  // Combine factors for better accuracy
  const isScam = (hasPersonalInfoRequest && hasUrgency) ||
                (hasAuthority && hasPersonalInfoRequest) ||
                (hasThreat && hasUrgency);
  
  const isSuspicious = (hasAuthority && hasUrgency) ||
                      (hasPersonalInfoRequest) ||
                      (hasThreat);
  
  let riskLevel: 'scam' | 'suspicious' | 'safe' = 'safe';
  let explanation = "This voice message appears to be legitimate with no concerning patterns.";
  
  if (isScam) {
    riskLevel = 'scam';
    explanation = "This message contains multiple scam indicators: " + 
                  (hasPersonalInfoRequest ? "requests for personal information, " : "") +
                  (hasUrgency ? "urgent action required, " : "") +
                  (hasThreat ? "threats or intimidation, " : "") +
                  (hasAuthority ? "impersonation of authority. " : "");
                  
    explanation = explanation.trimEnd();
    explanation = explanation.endsWith(",") ? explanation.slice(0, -1) + "." : explanation;
  } else if (isSuspicious) {
    riskLevel = 'suspicious';
    explanation = "This message contains some concerning elements that could indicate a scam: " + 
                 (hasPersonalInfoRequest ? "asking for personal information, " : "") +
                 (hasUrgency ? "creating a sense of urgency, " : "") +
                 (hasThreat ? "using threatening language, " : "") +
                 (hasAuthority ? "claiming to be from a trusted organization. " : "");
                 
    explanation = explanation.trimEnd();
    explanation = explanation.endsWith(",") ? explanation.slice(0, -1) + "." : explanation;
  }
  
  return {
    riskLevel,
    justification: explanation,
    detectedLanguage,
    originalContent: transcription || "Voice transcription analysis",
    timestamp: new Date().toISOString(),
    confidenceLevel: isScam ? 'high' : isSuspicious ? 'medium' : 'high'
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
