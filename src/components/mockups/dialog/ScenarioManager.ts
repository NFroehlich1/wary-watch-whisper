
// Predefined scenario messages that cover different scam types
export interface ScenarioMessage {
  text: string;
  scenario: string;
}

export const SCENARIO_MESSAGES: ScenarioMessage[] = [
  // Investment scam scenario
  { 
    text: "Hello! I'm your financial advisor AI. I've analyzed your profile and found you qualify for our exclusive investment program with guaranteed 15% returns. Would you like to hear more?",
    scenario: "investment"
  },
  { 
    text: "Great! Our premium investment opportunity is only available to select clients. It offers returns 10x higher than traditional banks. To proceed with verification, I'll need your bank account details. Which bank do you use?",
    scenario: "investment"
  },
  { 
    text: "Perfect. For security verification, I'll need your account number and the last 4 digits of your social security number. This helps us verify your eligibility for our VIP program.",
    scenario: "investment"
  },
  
  // Banking security scenario
  { 
    text: "URGENT SECURITY ALERT: We've detected suspicious activity on your account. Please verify your identity immediately to prevent unauthorized transfers.",
    scenario: "banking"
  },
  { 
    text: "To secure your account, we need to verify your identity. Please confirm your account password and PIN code to continue the verification process.",
    scenario: "banking"
  },
  { 
    text: "Your account has been temporarily restricted. To restore full access, please provide your credit card details including the security code on the back.",
    scenario: "banking"
  },
  
  // Gift card scam
  { 
    text: "Congratulations! You've been selected for a special reward program. You can claim $500 in gift cards by paying a small processing fee of $50. How would you like to proceed?",
    scenario: "gift"
  },
  { 
    text: "To claim your gift cards, please provide your credit card information for the processing fee. Once verified, we'll send your rewards within 24 hours.",
    scenario: "gift"
  },
  
  // Tech support scam
  { 
    text: "WARNING: Your computer has been infected with malware! Our security scan detected 23 viruses. Call our support line immediately or provide remote access to your device.",
    scenario: "tech"
  },
  { 
    text: "To remove the viruses, we need to install our premium security software. The license costs $299, but it's a small price for complete protection. How would you like to pay?",
    scenario: "tech"
  },
  
  // Romance scam
  { 
    text: "I've really enjoyed our conversations. I feel we have a special connection. Unfortunately, I'm currently stuck abroad and my wallet was stolen. Could you help me with $500 for a flight home?",
    scenario: "romance"
  },
  { 
    text: "Thank you for considering helping me. You're the only one I trust right now. If you could transfer the money via Western Union, I promise I'll pay you back as soon as I return.",
    scenario: "romance"
  }
];

/**
 * Get the next scenario message without repeating recent messages
 */
export const getNextScenarioMessage = (
  currentScenario: string, 
  messageCount: number, 
  messages: any[]
): ScenarioMessage | null => {
  // Find messages matching the current scenario
  const scenarioMessages = SCENARIO_MESSAGES.filter(msg => msg.scenario === currentScenario);
  
  // Get index for current scenario progression
  const scenarioIndex = Math.min(
    messageCount % scenarioMessages.length,
    scenarioMessages.length - 1
  );
  
  // Check if we've used all messages in this scenario
  const usedAllScenarioMessages = messageCount >= scenarioMessages.length * 2;
  
  // If we've exhausted this scenario, switch to a new one
  if (usedAllScenarioMessages) {
    // Get all distinct scenarios we've already used
    const usedScenarios = new Set(
      messages
        .filter((m: any) => m.scenario)
        .map((m: any) => m.scenario)
    );
    
    // Find an unused scenario if possible
    const availableScenarios = ['investment', 'banking', 'gift', 'tech', 'romance']
      .filter(s => !usedScenarios.has(s) || usedScenarios.size >= 5);
    
    if (availableScenarios.length > 0) {
      // Choose first unused scenario or random one if all used
      const newScenario = usedScenarios.size < 5 
        ? availableScenarios[0] 
        : availableScenarios[Math.floor(Math.random() * availableScenarios.length)];
      
      // Get the first message from the new scenario
      return SCENARIO_MESSAGES.find(msg => msg.scenario === newScenario) || null;
    }
  }
  
  // Get the next message in the current scenario and ensure we don't repeat recent messages
  const lastThreeMessages = messages.slice(-6).map(m => m.text);
  const candidateMessage = scenarioMessages[scenarioIndex];
  
  // Check if this exact message was sent recently
  if (candidateMessage && !lastThreeMessages.includes(candidateMessage.text)) {
    return candidateMessage;
  } else {
    // Try to find another message in this scenario that wasn't sent recently
    const alternateMessage = scenarioMessages.find(msg => !lastThreeMessages.includes(msg.text));
    if (alternateMessage) {
      return alternateMessage;
    } else {
      // Switch scenarios if all messages in this scenario were recently used
      return getAlternativeScenario(currentScenario, messages);
    }
  }
};

/**
 * Get a message from an alternative scenario when current one has too many repeats
 */
export const getAlternativeScenario = (
  currentScenario: string,
  messages: any[]
): ScenarioMessage | null => {
  const recentTexts = messages.slice(-6).map(m => m.text);
  
  // Get all scenarios except current
  const otherScenarios = ['investment', 'banking', 'gift', 'tech', 'romance']
    .filter(s => s !== currentScenario);
  
  // Randomly select a new scenario
  const newScenario = otherScenarios[Math.floor(Math.random() * otherScenarios.length)];
  
  // Get all messages for this new scenario
  const newScenarioMessages = SCENARIO_MESSAGES.filter(msg => msg.scenario === newScenario);
  
  // Find a message that wasn't used recently
  const unusedMessage = newScenarioMessages.find(msg => !recentTexts.includes(msg.text));
  
  if (unusedMessage) {
    return unusedMessage;
  }
  
  // If all else fails, return the first message from the new scenario
  return newScenarioMessages[0] || null;
};
