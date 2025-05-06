
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ScamResult, DetectionType, Language, GeminiOptions } from '../types';
import { ScamDetectionContextType } from './types';
import { useScamDetector } from '../hooks/useScamDetector';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { askAnalysisQuestion as askQuestion } from '../utils/askAnalysisQuestion';

const ScamDetectionContext = createContext<ScamDetectionContextType | undefined>(undefined);

export const useScamDetection = () => {
  const context = useContext(ScamDetectionContext);
  if (!context) {
    throw new Error('useScamDetection must be used within a ScamDetectionProvider');
  }
  return context;
};

export const ScamDetectionProvider = ({ children }: { children: ReactNode }) => {
  const [geminiOptions, setGeminiOptionsState] = useState<GeminiOptions>({
    apiKey: '',
    enabled: true
  });
  
  const { loading, results, detectScam, resetResult } = useScamDetector(geminiOptions);
  const { audioPlaying, playAudio } = useAudioPlayer();
  
  const setGeminiOptions = (options: Partial<GeminiOptions>) => {
    setGeminiOptionsState(prev => ({ ...prev, ...options }));
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
