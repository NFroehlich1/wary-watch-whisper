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
      
      // Mock detection logic
      let detectedRisk: ScamResult;
      
      if (type === 'url') {
        detectedRisk = mockUrlCheck(content as string);
      } else if (type === 'text') {
        detectedRisk = mockTextCheck(content as string, language);
      } else {
        detectedRisk = mockVoiceCheck();
      }
      
      // Add Gemini AI verification if enabled
      if (geminiOptions.enabled && geminiOptions.apiKey && (type === 'url' || type === 'text')) {
        try {
          const contentToVerify = content as string;
          const geminiResult = await verifyWithGemini(
            contentToVerify, 
            type, 
            detectedRisk.detectedLanguage, 
            geminiOptions.apiKey
          );
          
          // Add Gemini's assessment to the result
          detectedRisk.aiVerification = `Gemini AI: ${geminiResult.explanation}`;
          
          // In case of disagreement between our mock check and Gemini, make the result more suspicious
          if (geminiResult.riskAssessment === 'scam' && detectedRisk.riskLevel !== 'scam') {
            detectedRisk.riskLevel = 'suspicious';
            detectedRisk.justification += ' However, additional AI analysis found potential scam patterns.';
          }
        } catch (error) {
          console.error('Gemini verification error:', error);
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
    // Simple mock logic for demo purposes
    const isScam = url.includes('scam') || url.includes('phish');
    // Added more suspicious indicators
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
      timestamp: new Date().toISOString()
    };
  };
  
  const mockTextCheck = (text: string, language?: Language): ScamResult => {
    // Always use the detectTextLanguage function from utils to detect the language
    const detectedLanguage = detectTextLanguage(text);
    
    // Simple mock logic for demo purposes with additional suspicious category
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
      timestamp: new Date().toISOString()
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
    
    speech.text = `${getVerdictText(result.riskLevel, result.detectedLanguage)}. ${result.justification}`;
    speech.onend = () => setAudioPlaying(false);
    
    window.speechSynthesis.speak(speech);
  };
  
  const getVerdictText = (riskLevel: string, language: Language): string => {
    if (language === 'es') {
      if (riskLevel === 'scam') return "Estafa detectada";
      if (riskLevel === 'suspicious') return "Contenido sospechoso";
      return "Contenido seguro";
    } else if (language === 'fr') {
      if (riskLevel === 'scam') return "Arnaque détectée";
      if (riskLevel === 'suspicious') return "Contenu suspect";
      return "Contenu sécurisé";
    } else if (language === 'de') {
      if (riskLevel === 'scam') return "Betrug erkannt";
      if (riskLevel === 'suspicious') return "Verdächtiger Inhalt";
      return "Sicherer Inhalt";
    } else {
      if (riskLevel === 'scam') return "Scam detected";
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
