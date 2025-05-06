
/**
 * Generates prompts for Gemini AI requests
 * This file contains functions for creating structured prompts
 */

import { Language } from "../types";

/**
 * Creates a prompt for URL analysis in English
 */
export const getUrlPromptInEnglish = (url: string): string => {
  return `Analyze if this URL is safe, suspicious or a scam. URL: "${url}". 
  Please respond with one of these exact classifications first:
  RESULT: SAFE
  RESULT: SUSPICIOUS 
  RESULT: HIGH SUSPICION
  RESULT: SCAM

  Then provide a brief plain text explanation why.`;
};

/**
 * Creates a prompt for text analysis in English
 */
export const getTextPromptInEnglish = (text: string): string => {
  return `Analyze if this message contains signs of scam, suspicious content or if it's safe. Message: "${text}". 
  Please respond with one of these exact classifications first:
  RESULT: SAFE
  RESULT: SUSPICIOUS
  RESULT: HIGH SUSPICION
  RESULT: SCAM

  Then provide a brief plain text explanation why.`;
};

/**
 * Creates a specialized prompt for voice message transcription analysis
 * This includes specific patterns and indicators common in phone/voice scams
 */
export const getVoicePromptInEnglish = (transcription: string): string => {
  return `Analyze this voice message transcription for signs of scam, fraud or phishing: "${transcription}". 
  
  Pay special attention to:
  - Urgency tactics or pressure ("act now", "immediate", "urgent")
  - Claims to be from government, banks, or tech companies
  - Requests for personal information, account details, or payments
  - Threats of legal action, arrest, or account suspension
  - Unusual callback numbers or payment methods
  - Too-good-to-be-true offers or prizes
  
  Please respond with one of these exact classifications first:
  RESULT: SAFE
  RESULT: SUSPICIOUS
  RESULT: HIGH SUSPICION
  RESULT: SCAM

  Then provide a brief plain text explanation why, focusing on the specific scam techniques used (if any).`;
};

/**
 * Creates a prompt for a targeted analysis question
 * Now with optional userEmoji parameter
 */
export const getAnalysisQuestionPromptInEnglish = (
  question: string, 
  content: string, 
  riskLevel: string, 
  explanation: string,
  userEmoji?: string | null
): string => {
  let prompt = `You are analyzing a message or URL that was classified as ${riskLevel.toUpperCase()}.
  
  The content was: "${content}"
  Initial analysis: ${explanation}`;

  // Include the user's emoji reaction if available
  if (userEmoji) {
    prompt += `\n\nThe user reacted with this emoji: ${userEmoji} to the analysis.`;
  }
  
  prompt += `\n\nAnswer this specific question: "${question}"
  
  Focus ONLY on the question asked. Be direct and concise (3-4 sentences maximum).
  Use plain text without prefixes like "Answer:" or "Response:".
  If you cannot answer with the information provided, clearly state so.`;

  return prompt;
};

/**
 * Builds the URL prompt according to the specified language
 */
export const getUrlPrompt = (url: string, language: Language = 'en'): string => {
  // Currently we only use English prompts for more consistent AI results
  return getUrlPromptInEnglish(url);
};

/**
 * Builds the text prompt according to the specified language
 */
export const getTextPrompt = (text: string, language: Language = 'en'): string => {
  // Currently we only use English prompts for more consistent AI results
  return getTextPromptInEnglish(text);
};

/**
 * Builds the voice prompt according to the specified language
 */
export const getVoicePrompt = (transcription: string, language: Language = 'en'): string => {
  // Currently we only use English prompts for more consistent AI results
  return getVoicePromptInEnglish(transcription);
};

/**
 * Builds the analysis question prompt according to the specified language
 * Now with optional userEmoji parameter
 */
export const getAnalysisQuestionPrompt = (
  question: string, 
  content: string, 
  riskLevel: string, 
  explanation: string, 
  language: Language = 'en',
  userEmoji?: string | null
): string => {
  // Currently we only use English prompts for more consistent AI results
  return getAnalysisQuestionPromptInEnglish(question, content, riskLevel, explanation, userEmoji);
};
