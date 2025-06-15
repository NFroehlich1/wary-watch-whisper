import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Square, Play, Pause } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError, FunctionsRelayError, FunctionsFetchError } from '@supabase/supabase-js';

interface ElevenLabsTTSProps {
  text: string;
  className?: string;
  isDisabled?: boolean;
  voiceId?: string; // Eleven Labs voice ID
  autoPlay?: boolean; // Auto-play when component mounts/text changes
  onAutoPlayComplete?: () => void; // Callback when auto-play completes
}

const ElevenLabsTTS: React.FC<ElevenLabsTTSProps> = ({
  text,
  className = "",
  isDisabled = false,
  voiceId = "21m00Tcm4TlvDq8ikWAM", // Default voice ID (Rachel)
  autoPlay = false,
  onAutoPlayComplete
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasAutoPlayed = useRef(false);

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && !hasAutoPlayed.current && text.trim() && !isDisabled) {
      console.log("🔊 Auto-playing TTS...");
      hasAutoPlayed.current = true;
      
      // Small delay to ensure component is ready
      const timer = setTimeout(() => {
        playText().then(() => {
          if (onAutoPlayComplete) {
            onAutoPlayComplete();
          }
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [autoPlay, text, isDisabled]);

  // Reset auto-play flag when text changes
  useEffect(() => {
    hasAutoPlayed.current = false;
  }, [text]);

  const generateSpeech = async (textToSpeak: string): Promise<Blob> => {
    console.log("🔊 Generating speech via Supabase Edge Function...");
    
    const { data, error } = await supabase.functions.invoke('rapid-processor', {
      body: { 
        action: 'text-to-speech',
        data: { 
          text: textToSpeak,
          voiceId: voiceId
        }
      }
    });

    if (error) {
      console.error("Supabase function error:", error);
      
      // Enhanced error handling based on GitHub issue #45
      if (error instanceof FunctionsHttpError) {
        try {
          const errorMessage = await error.context.json();
          console.error('Function returned an error:', errorMessage);
          throw new Error(`Edge Function Fehler: ${errorMessage.error || JSON.stringify(errorMessage)}`);
        } catch (jsonError) {
          try {
            const errorText = await error.context.text();
            console.error('Function returned text error:', errorText);
            throw new Error(`Edge Function Fehler: ${errorText}`);
          } catch (textError) {
            console.error('Could not parse error response:', textError);
            throw new Error(`Edge Function Fehler: HTTP ${error.context.status || 'unknown status'}`);
          }
        }
      } else if (error instanceof FunctionsRelayError) {
        console.error('Relay error:', error.message);
        throw new Error(`Relay Fehler: ${error.message}`);
      } else if (error instanceof FunctionsFetchError) {
        console.error('Fetch error:', error.message);
        throw new Error(`Netzwerk Fehler: ${error.message}`);
      } else {
        throw new Error(`Unbekannter Fehler: ${error.message}`);
      }
    }

    if (data?.error) {
      console.error("Eleven Labs API Error:", data.error);
      throw new Error(data.error);
    }

    if (!data?.audioBase64) {
      throw new Error("Keine Audio-Daten erhalten");
    }

    // Convert base64 back to blob
    const binaryString = atob(data.audioBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Blob([bytes], { type: data.mimeType || 'audio/mpeg' });
  };

  const playText = async () => {
    if (!text.trim()) {
      toast.error("Kein Text zum Vorlesen verfügbar");
      return;
    }

    if (isPlaying && currentAudio) {
      // Pause current playback
      currentAudio.pause();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("🔊 Generating speech with Eleven Labs...");
      
      // Clean the text for better TTS (remove markdown, limit length)
      const cleanText = text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
        .replace(/[#*_`]/g, '') // Remove markdown formatting
        .replace(/\n+/g, ' ') // Replace line breaks with spaces
        .trim();

      // Limit text length (Eleven Labs has character limits)
      const maxLength = 2500; // Conservative limit
      const textToSpeak = cleanText.length > maxLength 
        ? cleanText.substring(0, maxLength).trim() + '...'
        : cleanText;

      if (textToSpeak.length === 0) {
        toast.error("Text ist zu kurz oder leer");
        return;
      }

      console.log(`🎯 Text length: ${textToSpeak.length} characters`);
      
      const audioBlob = await generateSpeech(textToSpeak);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create new audio element
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setCurrentAudio(audio);

      // Set up event listeners
      audio.addEventListener('loadstart', () => {
        console.log("🎵 Audio loading started");
      });

      audio.addEventListener('canplay', () => {
        console.log("🎵 Audio can start playing");
        setIsLoading(false);
        setIsPlaying(true);
      });

      audio.addEventListener('ended', () => {
        console.log("🎵 Audio playback ended");
        setIsPlaying(false);
        setCurrentAudio(null);
        URL.revokeObjectURL(audioUrl); // Clean up
      });

      audio.addEventListener('error', (e) => {
        console.error("🚫 Audio playback error:", e);
        setIsPlaying(false);
        setIsLoading(false);
        setCurrentAudio(null);
        toast.error("Fehler bei der Audiowiedergabe");
        URL.revokeObjectURL(audioUrl); // Clean up
      });

      // Start playing
      try {
        await audio.play();
        toast.success("Sprachausgabe gestartet!");
      } catch (playError) {
        console.error("🚫 Play error:", playError);
        toast.error("Fehler beim Starten der Wiedergabe. Möglicherweise blockiert der Browser die Audiowiedergabe.");
        setIsLoading(false);
        setIsPlaying(false);
        setCurrentAudio(null);
      }

    } catch (error) {
      console.error("🚫 TTS Error:", error);
      toast.error(error instanceof Error ? error.message : "Fehler bei der Sprachgenerierung");
      setIsLoading(false);
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  };

  const stopPlayback = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      setCurrentAudio(null);
      toast.success("Wiedergabe gestoppt");
    }
  };

  // Note: API key is handled by Supabase Edge Function, no client-side check needed

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isPlaying ? "destructive" : "outline"}
        size="sm"
        onClick={isPlaying ? stopPlayback : playText}
        disabled={isDisabled || isLoading || !text.trim()}
        className={`${className} ${isLoading ? 'animate-pulse' : ''}`}
        title={
          isLoading 
            ? "Generiere Sprache..." 
            : isPlaying 
              ? "Wiedergabe stoppen" 
              : "Text vorlesen (Eleven Labs)"
        }
      >
        {isLoading ? (
          <>
            <Volume2 className="h-4 w-4 mr-1 animate-spin" />
            Laden...
          </>
        ) : isPlaying ? (
          <>
            <Square className="h-4 w-4 mr-1" />
            Stop
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-1" />
            Vorlesen
          </>
        )}
      </Button>
      
      {/* Status indicator */}
      {isPlaying && (
        <div className="flex-1 text-xs text-green-600 italic truncate max-w-xs">
          🔊 Wird vorgelesen...
        </div>
      )}
      
      {isLoading && (
        <div className="flex-1 text-xs text-blue-600 italic truncate max-w-xs">
          ⏳ Generiere Sprache...
        </div>
      )}
    </div>
  );
};

export default ElevenLabsTTS; 