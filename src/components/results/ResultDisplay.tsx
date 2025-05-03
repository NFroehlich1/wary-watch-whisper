import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useScamDetection } from '@/context/ScamDetectionContext';
import { Volume2, Shield, ShieldAlert, ShieldX, Smile, MessageCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form schema with validation to ensure questions are related to analysis
const questionSchema = z.object({
  question: z.string()
    .min(5, { message: "Question must be at least 5 characters" })
    .max(200, { message: "Question is too long" })
    .refine(
      (val) => {
        // Only allow questions about analysis, risk, or explanation
        const analysisTerms = ['why', 'how', 'what', 'explain', 'analysis', 'risk', 'reason', 'detection', 'scam', 'suspicious', 'safe'];
        return analysisTerms.some(term => val.toLowerCase().includes(term));
      }, 
      { message: "Please ask questions related to the analysis results" }
    )
});

type QuestionForm = z.infer<typeof questionSchema>;

const ResultDisplay = () => {
  const { result, playAudio, audioPlaying, askAnalysisQuestion } = useScamDetection();
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  
  // Initialize form
  const form = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: "",
    },
  });
  
  if (!result) return null;
  
  // Helper function to determine status colors
  const getStatusColor = () => {
    switch (result.riskLevel) {
      case 'scam':
        return 'bg-status-scam';
      case 'suspicious':
        // Check if this is a high suspicion case based on confidence level
        return result.confidenceLevel === 'high'
                ? 'bg-amber-600' // darker orange/amber for higher suspicion
                : 'bg-status-suspicious'; // regular orange
      case 'safe':
        return 'bg-status-safe';
      default:
        return 'bg-gray-400';
    }
  };
  
  // Helper function to get risk level text
  const getRiskLevelText = () => {
    // Determine if it's a higher level of suspicious based on confidence
    if (result.riskLevel === 'suspicious' && result.confidenceLevel === 'high') {
      return 'HIGH SUSPICION';
    }
    
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
  
  // Helper function to get appropriate icon based on risk level
  const getStatusIcon = () => {
    if (result.riskLevel === 'scam') {
      return <ShieldX className="h-4 w-4 mr-1" />;
    } else if (result.riskLevel === 'suspicious') {
      return result.confidenceLevel === 'high' 
        ? <ShieldAlert className="h-4 w-4 mr-1" />
        : <Shield className="h-4 w-4 mr-1" />;
    } else {
      return <Shield className="h-4 w-4 mr-1" />;
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
      case 'de':
        return 'German';
      default:
        return 'Unknown';
    }
  };

  // Emojis organized by sentiment categories
  const emojis = {
    positive: ['😀', '😁', '😊', '👍', '🎉', '💯', '✅'],
    neutral: ['😐', '🤔', '🧐', '👀', '💭', '❓', '⚠️'],
    negative: ['😡', '🚫', '🛑', '⛔', '🙅', '💢', '❌']
  };
  
  const getEmojisByRiskLevel = () => {
    if (result.riskLevel === 'scam') {
      return emojis.negative;
    } else if (result.riskLevel === 'suspicious') {
      return result.confidenceLevel === 'high' 
        ? [...emojis.negative, ...emojis.neutral.slice(0, 3)]
        : emojis.neutral;
    } else {
      return emojis.positive;
    }
  };

  // Handle question submission
  const onSubmitQuestion = async (data: QuestionForm) => {
    if (!result) return;
    
    setAnswerLoading(true);
    setAnswer(null);
    
    try {
      // Use the context method to ask a question about analysis
      const response = await askAnalysisQuestion(data.question, result);
      setAnswer(response);
      form.reset();
    } catch (error) {
      console.error("Failed to get answer:", error);
      setAnswer("Sorry, I couldn't process your question about this analysis. Please try again with a different question.");
    } finally {
      setAnswerLoading(false);
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
          <Badge className={`${getStatusColor()} text-white font-bold flex items-center`}>
            {getStatusIcon()}
            {getRiskLevelText()}
          </Badge>
          {selectedEmoji && (
            <span className="text-xl ml-2" aria-label="Selected emoji">{selectedEmoji}</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Justification:</h4>
          <p className="text-base">{result.justification}</p>
        </div>
        
        {result.aiVerification && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">AI Verification (English):</h4>
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

        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Ask About Analysis:</h4>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitQuestion)} className="space-y-2">
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input 
                          placeholder="Ask why this was classified this way..." 
                          {...field} 
                          disabled={answerLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" size="sm" disabled={answerLoading}>
                  {answerLoading ? (
                    <span className="flex items-center gap-1">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></span>
                      Asking...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      Ask
                    </span>
                  )}
                </Button>
              </div>
              {form.formState.errors.question && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.question.message}
                </p>
              )}
            </form>
          </Form>
          
          {answer && (
            <div className="mt-3 p-3 bg-primary/5 rounded-md">
              <p className="text-sm">{answer}</p>
            </div>
          )}
        </div>

        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Add Emoji Reaction:</h4>
          <div className="flex flex-wrap gap-2 mt-1">
            {getEmojisByRiskLevel().map((emoji, index) => (
              <Button 
                key={index} 
                variant="outline" 
                className="p-2 h-auto text-lg"
                onClick={() => setSelectedEmoji(emoji)}
              >
                {emoji}
              </Button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="p-2 h-auto">
                  <Smile className="h-5 w-5" /> More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white p-2">
                <div className="grid grid-cols-5 gap-1 p-1">
                  {Object.values(emojis).flat().map((emoji, index) => (
                    <DropdownMenuItem key={index} className="p-2 cursor-pointer text-lg text-center" onClick={() => setSelectedEmoji(emoji)}>
                      {emoji}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedEmoji && (
              <Button 
                variant="ghost" 
                className="p-2 h-auto"
                onClick={() => setSelectedEmoji(null)}
              >
                Clear
              </Button>
            )}
          </div>
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
