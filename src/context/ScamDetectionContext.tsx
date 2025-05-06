
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ScamResult, DetectionType, Language, GeminiOptions } from '../types';
import { verifyWithGemini, getVerificationResult } from '../utils/gemini';
import { detectTextLanguage } from '../utils/language';
import { mockUrlCheck, mockTextCheck, mockVoiceCheck } from '../utils/mockDetectors';
import { playAudioFromResult } from '../utils/textToSpeech';
import { askAnalysisQuestion as askQuestion } from '../utils/askAnalysisQuestion';
import { ScamDetectionContextType } from './types';

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
    apiKey: '',
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
      if (geminiOptions.enabled && (type === 'url' || type === 'text')) {
        try {
          const contentToVerify = content as string;
          
          // Get jobId
          const { jobId } = await verifyWithGemini(
            contentToVerify, 
            type, 
            detectedRisk.detectedLanguage
          );
          
          // Now check for job completion with improved exponential backoff
          let jobComplete = false;
          let attempts = 0;
          let maxAttempts = 15; // Increased max attempts for more patience
          let geminiResult;
          
          while (!jobComplete && attempts < maxAttempts) {
            attempts++;
            // Use exponential backoff: wait longer between retries
            const backoffTime = Math.min(1000 * Math.pow(1.5, attempts-1), 10000); // Max 10 seconds between attempts
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            
            const jobStatus = await getVerificationResult(jobId);
            
            if (jobStatus.status === 'completed' && jobStatus.result) {
              jobComplete = true;
              geminiResult = jobStatus.result;
            } else if (jobStatus.status === 'failed') {
              console.error('Gemini verification failed:', jobStatus.error);
              break;
            }
          }
          
          if (geminiResult) {
            // Use Gemini's assessment as the primary source of truth
            detectedRisk.riskLevel = geminiResult.riskAssessment;
            detectedRisk.confidenceLevel = geminiResult.confidenceLevel;
            detectedRisk.justification = geminiResult.explanation;
            detectedRisk.aiVerification = `Gemini AI analyzed this content as ${geminiResult.riskAssessment.toUpperCase()}${geminiResult.confidenceLevel ? ` (${geminiResult.confidenceLevel} confidence)` : ''}: ${geminiResult.explanation}`;
          } else {
            detectedRisk.aiVerification = "Gemini AI analysis timed out or failed. Using built-in detection instead.";
          }
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

  const resetResult = () => {
    setResult(null);
  };
  
  const playAudio = () => {
    if (!result) return;
    
    setAudioPlaying(true);
    playAudioFromResult(result, () => setAudioPlaying(false));
  };
  
  const askAnalysisQuestion = async (question: string, result: ScamResult): Promise<string> => {
    return await askQuestion(question, result, geminiOptions);
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
        setGeminiOptions,
        askAnalysisQuestion
      }}
    >
      {children}
    </ScamDetectionContext.Provider>
  );
};
