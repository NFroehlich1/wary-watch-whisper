
import { useState } from 'react';
import { ScamResult } from '../types';
import { playAudioFromResult } from '../utils/textToSpeech';

/**
 * Hook that provides audio playback functionality
 */
export const useAudioPlayer = () => {
  const [audioPlaying, setAudioPlaying] = useState(false);
  
  const playAudio = (result: ScamResult) => {
    if (!result) return;
    
    setAudioPlaying(true);
    playAudioFromResult(result, () => setAudioPlaying(false));
  };

  return {
    audioPlaying,
    playAudio
  };
};
