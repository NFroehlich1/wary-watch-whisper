
import { ScamResult, DetectionType, Language, GeminiOptions } from '../types';

export interface ScamDetectionContextType {
  loading: boolean;
  result: ScamResult | null;
  detectScam: (content: string | File, type: DetectionType, language?: Language) => Promise<void>;
  resetResult: () => void;
  playAudio: () => void;
  audioPlaying: boolean;
  geminiOptions: GeminiOptions;
  setGeminiOptions: (options: Partial<GeminiOptions>) => void;
  askAnalysisQuestion: (question: string, result: ScamResult) => Promise<string>;
}
