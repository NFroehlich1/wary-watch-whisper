
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

export const getNextScenarioMessage = (
  currentScenario: string, 
  messageCount: number, 
  messages: any[]
): { text: string; scenario: string } | null => {
  // Find messages matching the current scenario
  const scenarioMessages = SCENARIO_MESSAGES.filter(msg => msg.scenario === currentScenario);
  
  // Get next message index for this scenario
  const nextIndex = Math.min(
    Math.floor(messageCount / 2) + 1, 
    scenarioMessages.length - 1
  );
  
  // If we've reached the end of this scenario, get a new one
  if (nextIndex >= scenarioMessages.length - 1) {
    const usedScenarios = new Set(messages
      .filter((m: any) => m.scenario)
      .map((m: any) => m.scenario));
    
    const availableScenarios = ['investment', 'banking', 'gift', 'tech', 'romance']
      .filter(s => !usedScenarios.has(s));
    
    // If there are available scenarios, switch to a new one
    if (availableScenarios.length > 0) {
      const newScenario = availableScenarios[0];
      
      // Find the first message for the new scenario
      const newScenarioMessage = SCENARIO_MESSAGES.find(msg => msg.scenario === newScenario);
      
      if (newScenarioMessage) {
        return newScenarioMessage;
      }
    } else {
      // If all scenarios used, pick a random one that's not the current
      const otherScenarios = ['investment', 'banking', 'gift', 'tech', 'romance']
        .filter(s => s !== currentScenario);
      
      const randomScenario = otherScenarios[Math.floor(Math.random() * otherScenarios.length)];
      
      // Find a message for the random scenario
      const randomMessage = SCENARIO_MESSAGES.find(msg => msg.scenario === randomScenario);
      
      if (randomMessage) {
        return randomMessage;
      }
    }
  } else {
    // Continue with next message in current scenario
    return scenarioMessages[nextIndex];
  }
  
  return null;
};

export const getAlternativeMessage = (
  scenario: string,
  lastMessages: any[]
): { text: string; scenario: string } | null => {
  // If duplicate, try to get another message
  const alternateMessages = SCENARIO_MESSAGES.filter(msg => 
    msg.scenario === scenario && 
    !lastMessages.some(m => m.text === msg.text)
  );
  
  if (alternateMessages.length > 0) {
    const randomIndex = Math.floor(Math.random() * alternateMessages.length);
    return alternateMessages[randomIndex];
  } else {
    // If no alternate messages in this scenario, switch scenarios
    const newScenario = ['investment', 'banking', 'gift', 'tech', 'romance']
      .filter(s => s !== scenario)[Math.floor(Math.random() * 4)];
    
    const newMessages = SCENARIO_MESSAGES.filter(msg => msg.scenario === newScenario);
    if (newMessages.length > 0) {
      return { ...newMessages[0], scenario: newScenario };
    }
  }
  
  return null;
};
