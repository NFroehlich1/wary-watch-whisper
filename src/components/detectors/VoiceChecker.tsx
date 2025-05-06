
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useScamDetection } from '@/context/ScamDetectionContext';
import ResultDisplay from '../results/ResultDisplay';
import { Mic } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

const VoiceChecker = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const { detectScam, loading, results, resetResult } = useScamDetection();
  const result = results.voice;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setTranscription(''); // Reset transcription when a new file is selected
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    resetResult('voice');
    try {
      // In a production app, we would transcribe the audio file here
      // For now we'll simulate transcription
      toast({
        title: "Transcribing audio",
        description: "Please wait while we process your voice message...",
      });
      
      // Simulate transcription delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here we'd normally call an actual transcription service
      const demoTranscript = "Hello, this is your bank calling. Your account has been compromised. Please provide your account details immediately for verification.";
      setTranscription(demoTranscript);
      
      // Now analyze the transcribed text with Gemini
      await detectScam(demoTranscript, 'voice', 'en');
    } catch (error) {
      console.error('Error processing voice note:', error);
      toast({
        title: "Error",
        description: "Failed to process voice message",
        variant: "destructive",
      });
    }
  };
  
  const handleSampleUpload = async () => {
    resetResult('voice');
    
    // Use a realistic sample transcription that could be a scam
    const sampleTranscript = "URGENT: This is your bank security department. We've detected suspicious transactions on your account. Please call our security line immediately at this number to verify your identity and prevent further unauthorized charges.";
    setTranscription(sampleTranscript);
    
    toast({
      title: "Sample Loaded",
      description: "Analyzing voice transcription...",
    });
    
    // Analyze the sample text with Gemini
    await detectScam(sampleTranscript, 'voice', 'en');
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Analyze Voice Messages</h2>
        <p className="text-muted-foreground">
          Transcribe and analyze voice messages for potential scam patterns.
        </p>
      </div>
      
      <div className="flex justify-center my-6">
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-32 w-32 rounded-full"
          onClick={handleSampleUpload}
          disabled={loading}
        >
          <Mic className={`h-12 w-12 mb-2 ${loading ? 'animate-pulse text-primary' : ''}`} />
          <span className="text-xs">Use Sample Voice Message</span>
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col space-y-4">
          <div className="border border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="file"
              id="voice-upload"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="voice-upload" className="cursor-pointer block space-y-2">
              <div className="flex justify-center">
                <Mic className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">
                {file ? file.name : "Click to upload a voice message"}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports WAV, MP3, OGG, M4A (max. 5 MB)
              </p>
            </label>
          </div>
          
          <Button type="submit" disabled={loading || !file}>
            {loading ? 'Analysis in progress...' : 'Analyze Voice Message'}
          </Button>
        </div>
      </form>
      
      {transcription && !result && (
        <div className="mt-4 p-4 border rounded-md bg-gray-50">
          <h3 className="text-sm font-medium mb-2">Transcription:</h3>
          <p className="text-sm">{transcription}</p>
          {loading && <div className="mt-2 text-xs text-muted-foreground">AI analysis in progress...</div>}
        </div>
      )}
      
      {result && <ResultDisplay result={result} />}
    </div>
  );
};

export default VoiceChecker;
