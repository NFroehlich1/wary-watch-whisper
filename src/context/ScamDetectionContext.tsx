
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

// Constants for exponential backoff
const MAX_JOB_CHECK_ATTEMPTS = 20; // Increased max attempts for more patience
const INITIAL_BACKOFF_MS = 500;    // Start with a 500ms wait
const MAX_BACKOFF_MS = 5000;       // Don't wait longer than 5 seconds between attempts
const BACKOFF_FACTOR = 1.3;        // Increase wait time by this factor with each attempt

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
  
  /**
   * Calculate backoff time for retry attempts using exponential backoff
   */
  const calculateBackoffTime = (attempt: number): number => {
    // Use exponential backoff formula: initialBackoff * (factor ^ attempt)
    const backoffTime = INITIAL_BACKOFF_MS * Math.pow(BACKOFF_FACTOR, attempt);
    // Make sure we don't exceed the maximum backoff time
    return Math.min(backoffTime, MAX_BACKOFF_MS);
  };
  
  // In a real app, this would make API calls to your backend
  const detectScam = async (content: string | File, type: DetectionType, language?: Language) => {
    setLoading(true);
    
    try {
      // Simulate API delay - reduced to improve responsiveness
      await new Promise(resolve => setTimeout(resolve, 300));
      
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
          let geminiResult;
          
          while (!jobComplete && attempts < MAX_JOB_CHECK_ATTEMPTS) {
            attempts++;
            
            // Calculate delay using exponential backoff
            const backoffTime = calculateBackoffTime(attempts-1);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            
            try {
              const jobStatus = await getVerificationResult(jobId);
              
              if (jobStatus.status === 'completed' && jobStatus.result) {
                jobComplete = true;
                geminiResult = jobStatus.result;
                break;
              } else if (jobStatus.status === 'failed') {
                console.error('Gemini verification failed:', jobStatus.error);
                break;
              }
              // If still pending, we'll try again in the next iteration
            } catch (statusError) {
              // If we get an error checking status, log it but continue trying
              console.error(`Error checking job ${jobId} status (attempt ${attempts}):`, statusError);
              // Don't break the loop - we'll try again after the backoff delay
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
