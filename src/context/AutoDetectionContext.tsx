
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { mockTextCheck, mockUrlCheck } from '../utils/mockDetectors';
import { ScamResult, RiskLevel } from '../types';
import { toast } from '@/hooks/use-toast';
import { useScamDetection } from './ScamDetectionContext';

interface AutoDetectionContextType {
  enableAutoDetection: boolean;
  setEnableAutoDetection: (enable: boolean) => void;
  sensitivityLevel: 'low' | 'medium' | 'high';
  setSensitivityLevel: (level: 'low' | 'medium' | 'high') => void;
  lastDetection: {
    content: string;
    result: ScamResult | null;
  } | null;
  scanMessage: (message: string) => ScamResult | null;
}

const AutoDetectionContext = createContext<AutoDetectionContextType | undefined>(undefined);

export const useAutoDetection = () => {
  const context = useContext(AutoDetectionContext);
  if (!context) {
    throw new Error('useAutoDetection must be used within an AutoDetectionProvider');
  }
  return context;
};

export const AutoDetectionProvider = ({ children }: { children: ReactNode }) => {
  const [enableAutoDetection, setEnableAutoDetection] = useState<boolean>(true);
  const [sensitivityLevel, setSensitivityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [lastDetection, setLastDetection] = useState<{ content: string; result: ScamResult | null } | null>(null);
  
  const { resetResult } = useScamDetection();

  // Function to scan a message for suspicious content
  const scanMessage = (message: string): ScamResult | null => {
    if (!enableAutoDetection || !message.trim()) {
      return null;
    }

    // Extract URLs if present
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlRegex);

    let result: ScamResult | null = null;

    // Check URLs first if they exist
    if (urls && urls.length > 0) {
      for (const url of urls) {
        const urlResult = mockUrlCheck(url);
        
        // Based on sensitivity level, determine what risk levels trigger an alert
        if (shouldAlert(urlResult.riskLevel)) {
          result = urlResult;
          break;
        }
      }
    }

    // If no suspicious URLs or no URLs at all, check the entire text
    if (!result) {
      const textResult = mockTextCheck(message);
      if (shouldAlert(textResult.riskLevel)) {
        result = textResult;
      }
    }

    // If we found something suspicious, update the last detection
    if (result) {
      setLastDetection({
        content: message,
        result: result
      });
      
      // Reset any previous result to ensure the new alert is shown
      resetResult('text');
    }

    return result;
  };

  // Helper to determine if an alert should be triggered based on sensitivity level
  const shouldAlert = (riskLevel: RiskLevel): boolean => {
    if (sensitivityLevel === 'high') {
      // High sensitivity: Alert for safe, suspicious, and scam
      return true;
    } else if (sensitivityLevel === 'medium') {
      // Medium sensitivity: Alert only for suspicious and scam
      return riskLevel === 'suspicious' || riskLevel === 'scam';
    } else {
      // Low sensitivity: Alert only for scam
      return riskLevel === 'scam';
    }
  };

  return (
    <AutoDetectionContext.Provider 
      value={{ 
        enableAutoDetection, 
        setEnableAutoDetection,
        sensitivityLevel, 
        setSensitivityLevel,
        lastDetection,
        scanMessage 
      }}
    >
      {children}
    </AutoDetectionContext.Provider>
  );
};
