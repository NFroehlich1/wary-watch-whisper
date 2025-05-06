
import { ScamResult, DetectionType, Language, GeminiOptions } from '../types';

export interface ScamDetectionContextType {
  loading: boolean;
  results: Record<DetectionType, ScamResult | null>;
  detectScam: (content: string | File, type: DetectionType, language?: Language) => Promise<void>;
  resetResult: (type: DetectionType) => void;
  playAudio: (result: ScamResult) => void;
  audioPlaying: boolean;
  geminiOptions: GeminiOptions;
  setGeminiOptions: (options: Partial<GeminiOptions>) => void;
  askAnalysisQuestion: (question: string, result: ScamResult, userEmoji?: string | null) => Promise<string>;
}
