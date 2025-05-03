
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScamDetection } from '@/context/ScamDetectionContext';
import { Volume2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import LanguageInfo from './LanguageInfo';
import ContentDisplay from './ContentDisplay';
import AnalysisQuestion from './AnalysisQuestion';
import EmojiReaction from './EmojiReaction';

const ResultDisplay = () => {
  const { result, playAudio, audioPlaying, askAnalysisQuestion } = useScamDetection();
  
  if (!result) return null;
  
  // Display the AI verification if available, otherwise fall back to the standard justification
  const getVerificationText = () => {
    if (result.aiVerification) {
      return result.aiVerification;
    }
    return result.justification;
  };
  
  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Analysis Results</CardTitle>
          <CardDescription>
            Analysis completed on {new Date(result.timestamp).toLocaleString()}
          </CardDescription>
        </div>
        <StatusBadge 
          riskLevel={result.riskLevel}
          confidenceLevel={result.confidenceLevel} 
        />
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Analysis:</h4>
          <p className="text-base">{getVerificationText()}</p>
        </div>
        
        <LanguageInfo detectedLanguage={result.detectedLanguage} />
        
        <ContentDisplay content={result.originalContent} />

        <AnalysisQuestion 
          result={result}
          askAnalysisQuestion={askAnalysisQuestion}
        />

        <EmojiReaction 
          riskLevel={result.riskLevel}
          confidenceLevel={result.confidenceLevel}
        />
      </CardContent>
      <CardFooter>
        <Button 
          onClick={playAudio} 
          variant="outline" 
          className="ml-auto"
          disabled={audioPlaying}
        >
          {audioPlaying ? <Volume2 className="mr-2 h-4 w-4 animate-pulse" /> : <Volume2 className="mr-2 h-4 w-4" />}
          {audioPlaying ? 'Playing...' : 'Listen to Result'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResultDisplay;
