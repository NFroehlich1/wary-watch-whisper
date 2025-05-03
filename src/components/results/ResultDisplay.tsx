
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScamDetection } from '@/context/ScamDetectionContext';
import { Volume2, VolumeX } from 'lucide-react';

const ResultDisplay = () => {
  const { result, playAudio, audioPlaying } = useScamDetection();
  
  if (!result) return null;
  
  // Helper function to determine status colors
  const getStatusColor = () => {
    switch (result.riskLevel) {
      case 'scam':
        return 'bg-status-scam';
      case 'suspicious':
        return 'bg-status-suspicious';
      case 'safe':
        return 'bg-status-safe';
      default:
        return 'bg-gray-400';
    }
  };
  
  // Helper function to get risk level text
  const getRiskLevelText = () => {
    switch (result.riskLevel) {
      case 'scam':
        return 'SCAM';
      case 'suspicious':
        return 'SUSPICIOUS';
      case 'safe':
        return 'SAFE';
      default:
        return 'UNKNOWN';
    }
  };
  
  // Helper function to get language name
  const getLanguageName = () => {
    switch (result.detectedLanguage) {
      case 'en':
        return 'English';
      case 'es':
        return 'Spanish';
      case 'fr':
        return 'French';
      default:
        return 'Unknown';
    }
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
        <div className="flex items-center space-x-2">
          <Badge className={`${getStatusColor()} text-white font-bold`}>
            {getRiskLevelText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Justification:</h4>
          <p className="text-base">{result.justification}</p>
        </div>
        
        {result.aiVerification && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">AI Verification:</h4>
            <p className="text-base">{result.aiVerification}</p>
          </div>
        )}
        
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Detected Language:</h4>
          <p className="text-base">{getLanguageName()}</p>
        </div>
        
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Original Content:</h4>
          <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap max-h-32 overflow-auto">
            {result.originalContent}
          </p>
        </div>
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
