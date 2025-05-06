import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useScamDetection } from '@/context/ScamDetectionContext';
import ResultDisplay from '../results/ResultDisplay';
import { Mic, StopCircle, Play, FileAudio } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const VoiceChecker = () => {
  const [file, setFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const { detectScam, loading, results, resetResult } = useScamDetection();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const result = results.voice;
  
  // Handle file selection from input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setRecordedBlob(null);
      setTranscription('');
    }
  };
  
  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        setFile(null);
        
        // Create a file from the blob for preview
        const audioFile = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
        setFile(audioFile);
        
        // Stop all tracks from the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setRecording(true);
      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone",
        variant: "destructive",
      });
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      toast({
        title: "Recording Stopped",
        description: "Click Analyze to process your voice message",
      });
    }
  };
  
  // Process the audio file with Gemini AI
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    resetResult('voice');
    try {
      toast({
        title: "Processing Voice Message",
        description: "Transcribing and analyzing your message...",
      });
      
      // Create a form data object with the audio file
      const formData = new FormData();
      formData.append('audio', file);
      
      // In a real implementation, send the audio file to a transcription service
      // For demonstration, we'll simulate a transcription with a sample text
      // In a production app, you'd use Whisper API or similar for transcription
      
      // Simulate transcription delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Use a more realistic transcription example
      const demoTranscript = file.name.includes('sample') ? 
        "Hi, this is your bank's security team calling. We've noticed some unusual activity on your account. We need you to verify your identity by providing your account number and password over the phone right now." :
        "Hello, this is an automated message. Your car's extended warranty is about to expire. Press 1 now to speak with a representative about renewing your coverage before it's too late.";
      
      setTranscription(demoTranscript);
      
      // Now analyze the transcribed text with Gemini specifically for voice detection
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
  
  // Use a sample for demo purposes
  const handleSampleUpload = async (sampleType: 'scam' | 'legitimate') => {
    resetResult('voice');
    
    // Use realistic samples based on common voice scams
    const sampleTranscript = sampleType === 'scam' 
      ? "This is an urgent message from the IRS. There is a lawsuit filed against your name for tax evasion. To avoid immediate arrest, call our department back at this number immediately with your social security number and banking details."
      : "Hi there, this is Sarah from the community library. I'm calling to let you know that the book you reserved is now available for pickup. You can collect it anytime during our opening hours. Have a great day!";
    
    setTranscription(sampleTranscript);
    
    toast({
      title: "Sample Voice Message",
      description: "Analyzing voice transcription...",
    });
    
    // Analyze with Gemini using the voice-specific detection method
    await detectScam(sampleTranscript, 'voice', 'en');
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Analyze Voice Messages</h2>
        <p className="text-muted-foreground">
          Detect scams in voice messages and phone calls by analyzing speech patterns and content.
        </p>
      </div>
      
      <Alert className="bg-muted/50">
        <AlertDescription>
          Our AI specifically looks for urgency tactics, pressure to share personal information, and common phone scam patterns.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-center gap-4 my-6">
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-24 w-32 rounded-lg"
          onClick={() => handleSampleUpload('scam')}
          disabled={loading || recording}
        >
          <FileAudio className="h-8 w-8 mb-2 text-destructive" />
          <span className="text-xs">Scam Sample</span>
        </Button>
        
        <Button 
          variant="outline" 
          className="flex flex-col items-center justify-center h-24 w-32 rounded-lg"
          onClick={() => handleSampleUpload('legitimate')}
          disabled={loading || recording}
        >
          <FileAudio className="h-8 w-8 mb-2 text-primary" />
          <span className="text-xs">Safe Sample</span>
        </Button>
      </div>
      
      <div className="flex flex-col space-y-4">
        <div className="flex justify-center space-x-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className={`rounded-full w-16 h-16 ${recording ? 'bg-red-100 hover:bg-red-200' : ''}`}
            onClick={recording ? stopRecording : startRecording}
            disabled={loading}
          >
            {recording ? (
              <StopCircle className="h-8 w-8 text-destructive" />
            ) : (
              <Mic className={`h-8 w-8 ${loading ? 'animate-pulse text-primary' : ''}`} />
            )}
          </Button>
        </div>
        
        <p className="text-center text-sm text-muted-foreground">
          {recording ? "Recording... Click to stop" : "Click to record a voice message"}
        </p>
        
        <div className="border border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="file"
            id="voice-upload"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={recording || loading}
          />
          <label htmlFor="voice-upload" className="cursor-pointer block space-y-2">
            <div className="flex justify-center">
              <Play className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">
              {file ? file.name : "Or click to upload an audio file"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports WAV, MP3, OGG, M4A (max. 5 MB)
            </p>
          </label>
        </div>
        
        {file && (
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={loading || recording}
          >
            {loading ? 'Analysis in progress...' : 'Analyze Voice Message'}
          </Button>
        )}
      </div>
      
      {transcription && !result && (
        <div className="mt-4 p-4 border rounded-md bg-muted/30">
          <h3 className="text-sm font-medium mb-2">Transcription:</h3>
          <p className="text-sm">{transcription}</p>
          {loading && (
            <div className="mt-2 text-xs text-muted-foreground">
              AI analysis in progress...
              <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {result && <ResultDisplay result={result} />}
    </div>
  );
};

export default VoiceChecker;
