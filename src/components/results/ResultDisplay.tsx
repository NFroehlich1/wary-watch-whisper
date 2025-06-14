
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useScamDetection } from '@/context/ScamDetectionContext';
import { Volume2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import LanguageInfo from './LanguageInfo';
import ContentDisplay from './ContentDisplay';
import AnalysisQuestion from './AnalysisQuestion';
import EmojiReaction from './EmojiReaction';
import { getTranslation } from '@/utils/language';
import { ScamResult } from '@/types';

interface ResultDisplayProps {
  result: ScamResult;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result }) => {
  const { playAudio, audioPlaying, askAnalysisQuestion } = useScamDetection();
  const [userEmoji, setUserEmoji] = useState<string | null>(null);
  
  if (!result) return null;
  
  // Display the AI verification if available, otherwise fall back to the standard justification
  const getVerificationText = () => {
    if (result.aiVerification) {
      return result.aiVerification;
    }
    return result.justification;
  };

  const handleEmojiSelected = (emoji: string | null) => {
    setUserEmoji(emoji);
  };
  
  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Analysis Result</CardTitle>
          <CardDescription>
            Analysis performed on {new Date(result.timestamp).toLocaleString()}
          </CardDescription>
        </div>
        <StatusBadge 
          riskLevel={result.riskLevel}
          confidenceLevel={result.confidenceLevel} 
        />
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="bg-muted p-3 rounded-md text-sm text-muted-foreground mb-4">
          <strong>Note:</strong> This analysis serves only as guidance. Final judgment should always be based on your own discretion.
        </div>
        
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div className="whitespace-pre-line">{getVerificationText()}</div>
        </div>
        
        <LanguageInfo detectedLanguage={result.detectedLanguage} />
        
        <ContentDisplay content={result.originalContent} />

        <EmojiReaction 
          riskLevel={result.riskLevel}
          confidenceLevel={result.confidenceLevel}
          onEmojiSelected={handleEmojiSelected}
        />

        <AnalysisQuestion 
          result={result}
          askAnalysisQuestion={askAnalysisQuestion}
          userEmoji={userEmoji}
        />
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => playAudio(result)} 
          variant="outline" 
          className="ml-auto"
          disabled={audioPlaying}
        >
          {audioPlaying ? <Volume2 className="mr-2 h-4 w-4 animate-pulse" /> : <Volume2 className="mr-2 h-4 w-4" />}
          {audioPlaying ? 'Playing...' : getTranslation('listen', 'en')}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResultDisplay;
