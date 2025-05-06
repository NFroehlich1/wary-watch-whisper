import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ScamResult, DetectionType, Language, GeminiOptions } from '../types';
import { verifyWithGemini, getVerificationResult } from '../utils/gemini';
import { detectTextLanguage } from '../utils/language';
import { mockUrlCheck, mockTextCheck, mockVoiceCheck } from '../utils/mockDetectors';
import { playAudioFromResult } from '../utils/textToSpeech';
import { askAnalysisQuestion as askQuestion } from '../utils/askAnalysisQuestion';
import { ScamDetectionContextType } from './types';
import { toast } from "@/hooks/use-toast";

const ScamDetectionContext = createContext<ScamDetectionContextType | undefined>(undefined);

export const useScamDetection = () => {
  const context = useContext(ScamDetectionContext);
  if (!context) {
    throw new Error('useScamDetection must be used within a ScamDetectionProvider');
  }
  return context;
};

// Improved configuration for polling retries
const MAX_JOB_CHECK_ATTEMPTS = 40;      // Significantly increased max attempts
const INITIAL_BACKOFF_MS = 500;         // Start with a 500ms wait
const MAX_BACKOFF_MS = 8000;            // Maximum 8 second delay between attempts
const BACKOFF_FACTOR = 1.2;             // More moderate growth factor

export const ScamDetectionProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<DetectionType, ScamResult | null>>({
    url: null,
    text: null,
    voice: null
  });
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
  
  // Detect scam content
  const detectScam = async (content: string | File, type: DetectionType, language?: Language) => {
    setLoading(true);
    
    try {
      // Begin with the mock detection results as fallback
      let detectedRisk: ScamResult;
      
      if (type === 'url') {
        detectedRisk = mockUrlCheck(content as string);
      } else if (type === 'text') {
        detectedRisk = mockTextCheck(content as string, language);
      } else {
        detectedRisk = mockVoiceCheck();
      }
      
      // If Gemini is enabled and it's a text or URL check, use it
      if (geminiOptions.enabled && (type === 'url' || type === 'text')) {
        try {
          const contentToVerify = content as string;
          
          // Show loading toast to let user know AI is working
          const loadingToastId = toast({
            title: "AI Analysis",
            description: "Starting AI verification...",
            duration: 2000,
          });
          
          // Get jobId from the Edge Function
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
                toast({
                  title: "AI Analysis Complete",
                  description: `Analysis completed successfully`,
                  duration: 3000,
                });
                break;
              } else if (jobStatus.status === 'failed') {
                console.error('Gemini verification failed:', jobStatus.error);
                toast({
                  title: "AI Analysis Failed",
                  description: "Falling back to built-in detection",
                  variant: "destructive",
                });
                break;
              }
              
              // If still pending, continue to the next attempt
              // Every 10 attempts, show a progress toast
              if (attempts % 10 === 0) {
                toast({
                  title: "AI Analysis In Progress",
                  description: `Still analyzing... Please wait`,
                  duration: 2000,
                });
              }
            } catch (statusError) {
              console.error(`Error checking job ${jobId} status (attempt ${attempts}):`, statusError);
              
              // Don't break immediately - try a few more times 
              if (attempts >= 5 && attempts % 5 === 0) {
                toast({
                  title: "Connection Issue",
                  description: "Having trouble connecting to AI service...",
                  variant: "destructive",
                  duration: 2000,
                });
              }
              
              // If we've tried many times with errors, give up
              if (attempts >= 15) {
                toast({
                  title: "Connection Failed",
                  description: "Using built-in detection as fallback",
                  variant: "destructive",
                });
                break;
              }
            }
          }
          
          if (geminiResult) {
            // Use Gemini's assessment as the primary source of truth
            detectedRisk.riskLevel = geminiResult.riskAssessment;
            detectedRisk.confidenceLevel = geminiResult.confidenceLevel;
            detectedRisk.justification = geminiResult.explanation;
            detectedRisk.aiVerification = `AI analysis: ${geminiResult.riskAssessment.toUpperCase()}\n\n${geminiResult.explanation}`;
          } else {
            detectedRisk.aiVerification = "AI analysis unavailable. Using built-in detection instead.";
            toast({
              title: "AI Analysis Unavailable",
              description: "Using built-in detection as fallback",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Gemini verification error:', error);
          detectedRisk.aiVerification = "AI analysis failed. Using built-in detection instead.";
          toast({
            title: "AI Analysis Error",
            description: "Using built-in detection as fallback",
            variant: "destructive",
          });
        }
      }
      
      // Store the result for the specific detection type
      setResults(prevResults => ({
        ...prevResults,
        [type]: detectedRisk
      }));
    } catch (error) {
      console.error('Detection error:', error);
      toast({
        title: "Detection Error",
        description: "An error occurred during analysis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetResult = (type: DetectionType) => {
    setResults(prevResults => ({
      ...prevResults,
      [type]: null
    }));
  };
  
  const playAudio = (result: ScamResult) => {
    if (!result) return;
    
    setAudioPlaying(true);
    playAudioFromResult(result, () => setAudioPlaying(false));
  };
  
  // Update the askAnalysisQuestion function to include the userEmoji parameter
  const askAnalysisQuestion = async (
    question: string, 
    result: ScamResult, 
    userEmoji?: string | null
  ): Promise<string> => {
    return await askQuestion(question, result, userEmoji, geminiOptions);
  };
  
  return (
    <ScamDetectionContext.Provider 
      value={{ 
        loading, 
        results, 
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
