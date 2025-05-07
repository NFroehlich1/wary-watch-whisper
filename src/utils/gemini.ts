
/**
 * Main module for Gemini AI integration
 * Re-exports functions from specialized modules
 */
import { verifyWithGemini, getVerificationResult } from './gemini-client';
import { extractRiskAssessment, extractExplanation, extractConfidenceLevel } from './response-parser';

// Export main client functions
export { verifyWithGemini, getVerificationResult };

// Export response-parser functions
export { extractRiskAssessment, extractExplanation, extractConfidenceLevel };

// Export types
export type { VerificationResult, JobStatus } from './gemini-client';

// Export direct question functionality
export { askAnalysisQuestion } from './askAnalysisQuestion';
