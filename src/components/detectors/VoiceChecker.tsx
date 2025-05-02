
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useScamDetection } from '@/context/ScamDetectionContext';
import ResultDisplay from '../results/ResultDisplay';
import { Mic } from 'lucide-react';

const VoiceChecker = () => {
  const [file, setFile] = useState<File | null>(null);
  const { detectScam, loading, result, resetResult } = useScamDetection();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    resetResult();
    await detectScam(file, 'voice');
  };
  
  const handleSampleUpload = () => {
    // In a real app, this would be an actual audio file
    // For demo purposes, we'll just trigger the fake analysis
    resetResult();
    detectScam(new File([""], "sample-voice.mp3"), 'voice');
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Analyze Voice Notes</h2>
        <p className="text-muted-foreground">
          Transcribe and analyze voice notes for scam patterns.
        </p>
      </div>
      
      <div className="flex justify-center my-6">
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-32 w-32 rounded-full"
          onClick={handleSampleUpload}
        >
          <Mic className="h-12 w-12 mb-2" />
          <span className="text-xs">Use Sample Voice Note</span>
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
                {file ? file.name : "Click to upload a voice note"}
              </p>
              <p className="text-xs text-muted-foreground">
                Supports WAV, MP3, OGG, M4A (Max 5MB)
              </p>
            </label>
          </div>
          
          <Button type="submit" disabled={loading || !file}>
            {loading ? 'Analyzing...' : 'Analyze Voice Note'}
          </Button>
        </div>
      </form>
      
      {result && <ResultDisplay />}
    </div>
  );
};

export default VoiceChecker;
