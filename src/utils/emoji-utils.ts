
import { RiskLevel } from "@/types";

export type EmojiCategory = 'positive' | 'neutral' | 'negative';

// Emojis organized by sentiment categories
export const emojis: Record<EmojiCategory, string[]> = {
  positive: ['😀', '😁', '😊', '👍', '🎉', '💯', '✅'],
  neutral: ['😐', '🤔', '🧐', '👀', '💭', '❓', '⚠️'],
  negative: ['😡', '🚫', '🛑', '⛔', '🙅', '💢', '❌']
};

export const getEmojisByRiskLevel = (riskLevel: RiskLevel, confidenceLevel?: 'high' | 'medium' | 'low'): string[] => {
  if (riskLevel === 'scam') {
    return emojis.negative;
  } else if (riskLevel === 'suspicious') {
    return confidenceLevel === 'high' 
      ? [...emojis.negative, ...emojis.neutral.slice(0, 3)]
      : emojis.neutral;
  } else {
    return emojis.positive;
  }
};
