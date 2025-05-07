
import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import ScamPopupDialog from './ScamPopupDialog';
import { ScamResult } from '@/types';

interface ScamAlertBannerProps {
  result: ScamResult;
  content: string;
  onDismiss: () => void;
}

const ScamAlertBanner: React.FC<ScamAlertBannerProps> = ({ result, content, onDismiss }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  
  // Alert banner styling based on risk level
  const alertStyles = {
    scam: "border-red-500 bg-red-50 dark:bg-red-950/30 animate-pulse",
    suspicious: "border-amber-500 bg-amber-50 dark:bg-amber-950/30",
    safe: "border-green-500 bg-green-50 dark:bg-green-950/30"
  };

  const handleDismiss = () => {
    setShowBanner(false);
    onDismiss();
  };

  if (!showBanner) return null;

  return (
    <>
      <Alert className={`mb-4 flex items-center justify-between ${alertStyles[result.riskLevel]}`}>
        <div className="flex items-start">
          <ShieldAlert className={`h-5 w-5 mr-2 mt-0.5 ${result.riskLevel === 'scam' ? 'text-red-500' : result.riskLevel === 'suspicious' ? 'text-amber-500' : 'text-green-500'}`} />
          <div>
            <AlertTitle className={`font-bold ${result.riskLevel === 'scam' ? 'text-red-700 dark:text-red-300' : result.riskLevel === 'suspicious' ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'}`}>
              {result.riskLevel === 'scam' ? 'Warning: Potential scam detected!' : 
               result.riskLevel === 'suspicious' ? 'Caution: Suspicious message' : 
               'Note: Potential security information'}
            </AlertTitle>
            <AlertDescription className="text-sm mt-1">
              {result.riskLevel === 'scam' 
                ? 'This message contains fraudulent elements. Click Details for more information.'
                : result.riskLevel === 'suspicious'
                  ? 'This message contains suspicious elements. Please be cautious.'
                  : 'This message might be security-relevant.'}
            </AlertDescription>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsOpen(true)}
            className={result.riskLevel === 'scam' ? 'border-red-500' : result.riskLevel === 'suspicious' ? 'border-amber-500' : 'border-green-500'}
          >
            Details
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
          >
            Close
          </Button>
        </div>
      </Alert>
      
      <ScamPopupDialog 
        isOpen={isOpen} 
        setIsOpen={setIsOpen} 
        result={result}
        content={content}
      />
    </>
  );
};

export default ScamAlertBanner;
