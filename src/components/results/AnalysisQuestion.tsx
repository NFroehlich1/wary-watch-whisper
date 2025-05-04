
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
  askAnalysisQuestion: (question: string, result: ScamResult) => Promise<string>;
}

const AnalysisQuestion: React.FC<AnalysisQuestionProps> = ({ result, askAnalysisQuestion }) => {
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

  // Handle question submission
  const onSubmitQuestion = async (data: QuestionForm) => {
    setAnswerLoading(true);
    setAnswer(null);
    
    try {
      console.log("Submitting question:", data.question);
      // Use the context method to ask a question about analysis
      const response = await askAnalysisQuestion(data.question, result);
      console.log("Received answer:", response);
      
      if (!response || 
          response.includes("couldn't generate an answer") || 
          response.includes("couldn't answer this question") ||
          response.trim() === "") {
        toast({
          variant: "destructive",
          title: "Analysis Error",
          description: "Could not generate an answer to your question. Please try a different question.",
        });
        setAnswer("Sorry, I couldn't generate an answer to your question. Please try asking something else about this specific analysis.");
      } else {
        setAnswer(response);
      }
      
      form.reset();
    } catch (error) {
      console.error("Failed to get answer:", error);
      setAnswer("Sorry, I couldn't process your question about this analysis. Please try again with a different question.");
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Failed to get an answer to your question.",
      });
    } finally {
      setAnswerLoading(false);
    }
  };

  return (
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
                      placeholder="Ask anything about this analysis..." 
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
  );
};

export default AnalysisQuestion;
