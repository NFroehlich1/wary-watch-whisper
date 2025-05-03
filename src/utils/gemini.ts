
/**
 * Haupt-Module für Gemini AI Integration
 * Reexportiert Funktionen aus spezialisierten Modulen
 */
import { verifyWithGemini } from './gemini-client';
import { getUrlPromptInEnglish, getTextPromptInEnglish, getUrlPrompt, getTextPrompt } from './prompt-builder';
import { extractRiskAssessment, extractExplanation } from './response-parser';

// Exportiere die Haupt-Client-Funktion
export { verifyWithGemini };

// Exportiere Prompt-Builder-Funktionen
export { getUrlPromptInEnglish, getTextPromptInEnglish, getUrlPrompt, getTextPrompt };

// Exportiere Response-Parser-Funktionen
export { extractRiskAssessment, extractExplanation };
