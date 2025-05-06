
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useScamDetection } from '@/context/ScamDetectionContext';
import ResultDisplay from '../results/ResultDisplay';
import { Mic } from 'lucide-react';

const VoiceChecker = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const { detectScam, loading, results, resetResult } = useScamDetection();
  const result = results.voice;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    resetResult('voice');
    try {
      // For now we'll use a placeholder transcription until we implement the actual transcription service
      const demoTranscript = "This is a transcription of the voice message.";
      setTranscription(demoTranscript);
      
      // Now analyze the text content with Gemini
      await detectScam(demoTranscript, 'text', 'en');
    } catch (error) {
      console.error('Error processing voice note:', error);
    }
  };
  
  const handleSampleUpload = () => {
    resetResult('voice');
    // Use a sample English transcription for demo purposes
    const sampleTranscript = "URGENT: Your bank requires confirmation of your data. Please call us immediately at this unknown number.";
    setTranscription(sampleTranscript);
    
    // Analyze the sample text with Gemini
    detectScam(sampleTranscript, 'voice', 'en');
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Analyze Voice Messages</h2>
        <p className="text-muted-foreground">
          Transcribe and analyze voice messages for scam patterns.
        </p>
      </div>
      
      <div className="flex justify-center my-6">
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-32 w-32 rounded-full"
          onClick={handleSampleUpload}
        >
          <Mic className="h-12 w-12 mb-2" />
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
        </div>
      )}
      
      {result && <ResultDisplay result={result} />}
    </div>
  );
};

export default VoiceChecker;
