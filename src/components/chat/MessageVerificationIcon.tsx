
import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldX } from 'lucide-react';
import { RiskLevel } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import StatusBadge from '../results/StatusBadge';
import AnalysisQuestion from '../results/AnalysisQuestion';
import { useScamDetection } from '@/context/ScamDetectionContext';
import { ScamResult } from '@/types';

interface MessageVerificationIconProps {
  result?: ScamResult;
  messageId: string;
  messageContent: string;
}

const MessageVerificationIcon: React.FC<MessageVerificationIconProps> = ({ 
  result,
  messageId,
  messageContent 
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { askAnalysisQuestion } = useScamDetection();
  
  // If no result is available, show a neutral shield
  if (!result) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex cursor-pointer text-muted-foreground/70 hover:text-muted-foreground p-1.5 hover:bg-muted/30 rounded-full transition-colors">
              <Shield className="h-4 w-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Noch keine Verifizierung</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // Determine which icon to show based on risk level
  const getVerificationIcon = () => {
    switch (result.riskLevel) {
      case 'scam':
        return <ShieldX className="h-4 w-4 text-destructive" />;
      case 'suspicious':
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case 'safe':
      default:
        return <Shield className="h-4 w-4 text-green-500" />;
    }
  };
  
  // Get tooltip text based on risk level
  const getTooltipText = () => {
    switch (result.riskLevel) {
      case 'scam':
        return 'Warnung: Scam-Nachricht erkannt';
      case 'suspicious':
        return 'Vorsicht: Verdächtige Nachricht';
      case 'safe':
      default:
        return 'Sichere Nachricht';
    }
  };

  // Get background color based on risk level for the icon background
  const getIconBackground = () => {
    switch (result.riskLevel) {
      case 'scam':
        return 'bg-red-50 dark:bg-red-900/20';
      case 'suspicious':
        return 'bg-amber-50 dark:bg-amber-900/20';
      case 'safe':
      default:
        return 'bg-green-50 dark:bg-green-900/20';
    }
  };
  
  // Handle click on verification icon
  const handleVerificationClick = () => {
    console.log('Verification icon clicked, opening dialog for message:', messageId);
    setDialogOpen(true);
  };
  
  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`z-10 inline-flex cursor-pointer hover:opacity-80 p-1.5 rounded-full ${getIconBackground()} transition-all duration-200 hover:scale-110`}
              onClick={handleVerificationClick}
              role="button"
              aria-label="Nachrichtenverifizierung anzeigen"
            >
              {getVerificationIcon()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {getVerificationIcon()}
              <span>Nachrichtenverifizierung</span>
            </DialogTitle>
            <DialogDescription>
              Analyse der Nachricht: "{messageContent.length > 50 ? messageContent.substring(0, 50) + '...' : messageContent}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium">Status:</span>
              <StatusBadge 
                riskLevel={result.riskLevel} 
                confidenceLevel={result.confidenceLevel}
              />
            </div>
            
            <div className="mt-2 p-3 bg-muted rounded-md text-sm text-muted-foreground">
              <div className="font-medium mb-1">Begründung:</div>
              <div className="text-foreground">
                {result.aiVerification || result.justification}
              </div>
            </div>
            
            <div className="mt-4">
              <AnalysisQuestion 
                result={result}
                askAnalysisQuestion={askAnalysisQuestion}
                userEmoji={null}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MessageVerificationIcon;
