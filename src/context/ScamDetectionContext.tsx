import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ScamResult, DetectionType, Language, GeminiOptions } from '../types';
import { verifyWithGemini } from '../utils/gemini';
import { detectTextLanguage } from '../utils/language';

interface ScamDetectionContextType {
  loading: boolean;
  result: ScamResult | null;
  detectScam: (content: string | File, type: DetectionType, language?: Language) => Promise<void>;
  resetResult: () => void;
  playAudio: () => void;
  audioPlaying: boolean;
  geminiOptions: GeminiOptions;
  setGeminiOptions: (options: Partial<GeminiOptions>) => void;
}

const ScamDetectionContext = createContext<ScamDetectionContextType | undefined>(undefined);

export const useScamDetection = () => {
  const context = useContext(ScamDetectionContext);
  if (!context) {
    throw new Error('useScamDetection must be used within a ScamDetectionProvider');
  }
  return context;
};

export const ScamDetectionProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamResult | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [geminiOptions, setGeminiOptionsState] = useState<GeminiOptions>({
    apiKey: 'AIzaSyDiZ4Kc7pNYsEqGw5Xqq_Zu2DvlCTibR9o', // Default from user input
    enabled: true
  });
  
  const setGeminiOptions = (options: Partial<GeminiOptions>) => {
    setGeminiOptionsState(prev => ({ ...prev, ...options }));
  };
  
  // In a real app, this would make API calls to your backend
  const detectScam = async (content: string | File, type: DetectionType, language?: Language) => {
    setLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Initialize with default results in case AI analysis fails
      let detectedRisk: ScamResult;
      
      if (type === 'url') {
        detectedRisk = mockUrlCheck(content as string);
      } else if (type === 'text') {
        detectedRisk = mockTextCheck(content as string, language);
      } else {
        detectedRisk = mockVoiceCheck();
      }
      
      // If Gemini is enabled and it's a text or URL check, use it as the primary classifier
      if (geminiOptions.enabled && geminiOptions.apiKey && (type === 'url' || type === 'text')) {
        try {
          const contentToVerify = content as string;
          const geminiResult = await verifyWithGemini(
            contentToVerify, 
            type, 
            detectedRisk.detectedLanguage, 
            geminiOptions.apiKey
          );
          
          // Use Gemini's assessment as the primary source of truth
          detectedRisk.riskLevel = geminiResult.riskAssessment;
          detectedRisk.confidenceLevel = geminiResult.confidenceLevel;
          detectedRisk.justification = geminiResult.explanation;
          detectedRisk.aiVerification = `Gemini AI analyzed this content as ${geminiResult.riskAssessment.toUpperCase()}${geminiResult.confidenceLevel ? ` (${geminiResult.confidenceLevel} confidence)` : ''}: ${geminiResult.explanation}`;
        } catch (error) {
          console.error('Gemini verification error:', error);
          // If AI analysis fails, we'll fall back to the mock results
          detectedRisk.aiVerification = "Gemini AI analysis failed. Using built-in detection instead.";
        }
      }
      
      setResult(detectedRisk);
    } catch (error) {
      console.error('Detection error:', error);
      // Handle error state
    } finally {
      setLoading(false);
    }
  };
  
  const mockUrlCheck = (url: string): ScamResult => {
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
  
  const mockTextCheck = (text: string, language?: Language): ScamResult => {
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
  
  const mockVoiceCheck = (): ScamResult => {
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
  
  const getJustification = (isScam: boolean, isVerySuspicious: boolean, isSuspicious: boolean, language: Language): string => {
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

  const resetResult = () => {
    setResult(null);
  };
  
  const playAudio = () => {
    if (!result) return;
    
    setAudioPlaying(true);
    
    // In a real app, this would play the TTS audio from the API
    // For now, we'll use browser's speech synthesis API
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
    speech.onend = () => setAudioPlaying(false);
    
    window.speechSynthesis.speak(speech);
  };
  
  const getVerdictText = (riskLevel: string, confidenceLevel?: string, language?: Language): string => {
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
  
  return (
    <ScamDetectionContext.Provider 
      value={{ 
        loading, 
        result, 
        detectScam, 
        resetResult, 
        playAudio,
        audioPlaying,
        geminiOptions,
        setGeminiOptions
      }}
    >
      {children}
    </ScamDetectionContext.Provider>
  );
};
