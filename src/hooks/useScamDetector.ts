
import { useState } from 'react';
import { ScamResult, DetectionType, Language, GeminiOptions } from '../types';
import { verifyWithGemini, getVerificationResult } from '../utils/gemini';
import { detectTextLanguage } from '../utils/language';
import { mockUrlCheck, mockTextCheck } from '../utils/mockDetectors';
import { toast } from "@/hooks/use-toast";
import { calculateBackoffTime } from '../context/utils';
import { MAX_JOB_CHECK_ATTEMPTS } from '../context/constants';

/**
 * Hook that provides scam detection functionality
 */
export const useScamDetector = (geminiOptions: GeminiOptions) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<DetectionType, ScamResult | null>>({
    url: null,
    text: null,
    voice: null
  });

  // Detect scam content
  const detectScam = async (content: string | File, type: DetectionType, language?: Language): Promise<ScamResult> => {
    setLoading(true);
    
    try {
      // Begin with the mock detection results as fallback
      let detectedRisk: ScamResult;
      
      if (type === 'url') {
        detectedRisk = mockUrlCheck(content as string);
      } else if (type === 'text') {
        detectedRisk = mockTextCheck(content as string, language);
      } else {
        detectedRisk = mockTextCheck(""); // Replace mockVoiceCheck with mockTextCheck for fallback
      }
      
      // If Gemini is enabled, use it for all detection types including voice
      if (geminiOptions.enabled) {
        try {
          const contentToVerify = content as string;
          
          // Show loading toast to let user know AI is working
          toast({
            title: "AI Analysis",
            description: `Starting AI verification for ${type === 'voice' ? 'voice message' : type}...`,
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
            
            // Add more detailed AI verification explanation based on detection type
            if (type === 'voice') {
              detectedRisk.aiVerification = `Voice Analysis: ${geminiResult.riskAssessment.toUpperCase()}\n\n${geminiResult.explanation}\n\nThis analysis is based on the speech patterns and content detected in the voice message.`;
            } else {
              detectedRisk.aiVerification = `AI analysis: ${geminiResult.riskAssessment.toUpperCase()}\n\n${geminiResult.explanation}`;
            }
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
      
      setLoading(false);
      return detectedRisk;
    } catch (error) {
      console.error('Detection error:', error);
      toast({
        title: "Detection Error",
        description: "An error occurred during analysis",
        variant: "destructive",
      });
      
      // Return a default "safe" result in case of error
      const safeResult: ScamResult = {
        riskLevel: 'safe',
        justification: 'Error occurred during detection, defaulting to safe',
        detectedLanguage: language || 'en',
        originalContent: typeof content === 'string' ? content : 'file content',
        timestamp: new Date().toISOString(),
        confidenceLevel: 'low'
      };
      
      setLoading(false);
      return safeResult;
    }
  };

  const resetResult = (type: DetectionType) => {
    setResults(prevResults => ({
      ...prevResults,
      [type]: null
    }));
  };

  return {
    loading,
    results,
    detectScam,
    resetResult
  };
};
