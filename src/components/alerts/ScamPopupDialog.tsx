
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusBadge from '../results/StatusBadge';
import { ScamResult } from '@/types';
import LanguageInfo from '../results/LanguageInfo';
import { useScamDetection } from '@/context/ScamDetectionContext';

interface ScamPopupDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  result: ScamResult;
  content: string;
}

const ScamPopupDialog: React.FC<ScamPopupDialogProps> = ({ isOpen, setIsOpen, result, content }) => {
  const { askAnalysisQuestion } = useScamDetection();
  const [analysis, setAnalysis] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Function to get additional AI analysis
  const getMoreAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await askAnalysisQuestion(
        "What's suspicious about this message? Explain in simple terms why it might be dangerous.", 
        result
      );
      setAnalysis(response);
    } catch (error) {
      console.error("Error getting analysis:", error);
      setAnalysis("Could not load detailed analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to highlight suspicious elements in content
  const highlightContent = (text: string): React.ReactNode => {
    // Simple implementation - in production this would be more sophisticated
    // based on what patterns were detected
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    if (parts.length <= 1) {
      return <span>{text}</span>; // No URLs found
    }
    
    return (
      <>
        {parts.map((part, i) => {
          // Check if this part matches a URL
          if (part.match(urlRegex)) {
            return <mark key={i} className="bg-amber-100 dark:bg-amber-900/30">{part}</mark>;
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <DialogTitle>Security Warning</DialogTitle>
            <DialogDescription>
              Analysis of a potentially suspicious message
            </DialogDescription>
          </div>
          <StatusBadge 
            riskLevel={result.riskLevel}
            confidenceLevel={result.confidenceLevel}
          />
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted rounded p-3 text-sm">
            <div className="font-medium mb-1 text-muted-foreground">Original text:</div>
            <div className="whitespace-pre-wrap">{highlightContent(content)}</div>
          </div>
          
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <h4>Why is this message suspicious?</h4>
            <p>{result.justification}</p>
            
            {analysis && (
              <div className="mt-3 border-t pt-3">
                <h4>Detailed Analysis:</h4>
                <p className="whitespace-pre-line">{analysis}</p>
              </div>
            )}
          </div>
          
          <LanguageInfo detectedLanguage={result.detectedLanguage} />
        </div>
        
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          {!analysis && (
            <Button 
              onClick={getMoreAnalysis} 
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Deeper Analysis'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScamPopupDialog;
