
import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ScamResult } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Form schema with less strict validation
const questionSchema = z.object({
  question: z.string()
    .min(3, { message: "Question must be at least 3 characters" })
    .max(250, { message: "Question is too long" })
});

type QuestionForm = z.infer<typeof questionSchema>;

interface AnalysisQuestionProps {
  result: ScamResult;
  askAnalysisQuestion: (question: string, result: ScamResult, userEmoji?: string | null) => Promise<string>;
  userEmoji?: string | null;
}

const AnalysisQuestion: React.FC<AnalysisQuestionProps> = ({ result, askAnalysisQuestion, userEmoji }) => {
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Initialize form
  const form = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: "",
    },
  });

  // Handle question submission - now including user emoji if available
  const onSubmitQuestion = async (data: QuestionForm) => {
    setAnswerLoading(true);
    setAnswer(null);
    
    try {
      console.log("Submitting question:", data.question, "User emoji:", userEmoji);
      // Pass the user's emoji reaction to the analysis function
      const response = await askAnalysisQuestion(data.question, result, userEmoji);
      console.log("Received answer:", response);
      
      if (!response || response.trim() === "") {
        toast({
          title: "Analysis Information",
          description: "I'll provide what I know about this analysis.",
        });
        
        // Provide a fallback response based on the analysis data we already have
        const fallbackResponse = `This content was classified as ${result.riskLevel}` + 
          (result.confidenceLevel ? ` with ${result.confidenceLevel} confidence` : '.') +
          `\n\nThe quick analysis showed: ${extractQuickAnalysisFromResult(result)}`;
        
        setAnswer(fallbackResponse);
      } else {
        setAnswer(response);
      }
      
      form.reset();
    } catch (error) {
      console.error("Failed to get answer:", error);
      // Prepare a fallback answer without markdown
      const fallbackResponse = `This was classified as ${result.riskLevel}` + 
        (result.confidenceLevel ? ` with ${result.confidenceLevel} confidence` : '.') +
        `\n\nThe quick analysis showed: ${extractQuickAnalysisFromResult(result)}`;
      
      setAnswer(fallbackResponse);
      toast({
        title: "Analysis Available",
        description: "I'll provide what I know about this content.",
      });
    } finally {
      setAnswerLoading(false);
    }
  };

  // Helper function to extract quick analysis information from result
  const extractQuickAnalysisFromResult = (result: ScamResult): string => {
    const justificationText = result.aiVerification || result.justification || '';
    
    // Look for the Analysis section in the justification
    if (justificationText.includes('ANALYSIS:')) {
      const analysisSection = justificationText
        .split('ANALYSIS:')[1]
        .split('KEY POINTS:')[0]
        .trim();
      return analysisSection;
    } else if (justificationText.includes('KEY POINTS:')) {
      const pointsSection = justificationText
        .split('KEY POINTS:')[1]
        .split('CONCLUSION:')[0]
        .trim();
      return pointsSection;
    }
    
    return justificationText.substring(0, 200) + '...';
  };

  return (
    <div>
      <h4 className="font-medium text-sm text-muted-foreground mb-1">Ask a specific question about this analysis:</h4>
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
                      placeholder="Example: Why is this suspicious? Is this message harmful?" 
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
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  Get Answer
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
        <div className="mt-3 p-3 bg-primary/5 rounded-md border border-primary/10">
          <div className="text-sm leading-relaxed whitespace-pre-line">
            {answer}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisQuestion;
