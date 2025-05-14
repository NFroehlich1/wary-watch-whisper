// Predefined scenario messages that cover different scam types
import { ScenarioMessage, Message } from '../types/ScamDialogTypes';

export const SCENARIO_MESSAGES: ScenarioMessage[] = [
  // Investment scam scenario
  { 
    text: "Hello! I'm your financial advisor AI. How can I help you today?",
    scenario: "investment"
  },
  { 
    text: "I notice you're interested in financial matters. I'm currently offering select clients access to our exclusive investment program with guaranteed 15% returns. Would you like to learn more about this opportunity?",
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
    text: "Hello, this is your bank's security department. We're contacting all customers today.",
    scenario: "banking"
  },
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
    text: "Hi there! I'm from customer rewards. You've been selected for a special promotion!",
    scenario: "gift"
  },
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
    text: "IMPORTANT NOTICE: We've detected unusual activity on your device. This is an automated security scan.",
    scenario: "tech"
  },
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
    text: "Hello there! I saw your profile and felt an immediate connection. I'd love to get to know you better.",
    scenario: "romance"
  },
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
 * Get the first message to initialize a conversation
 */
export const getFirstScenarioMessage = (): ScenarioMessage => {
  // Investment scenario is always the default starting point
  return SCENARIO_MESSAGES.find(msg => msg.scenario === 'investment' && 
    msg.text.includes("Hello! I'm your financial advisor AI")) || SCENARIO_MESSAGES[0];
};

/**
 * Get the next scenario message without repeating recent messages
 */
export const getNextScenarioMessage = (
  currentScenario: string, 
  messageCount: number, 
  messages: Message[]
): ScenarioMessage | null => {
  // Find messages matching the current scenario
  const scenarioMessages = SCENARIO_MESSAGES.filter(msg => msg.scenario === currentScenario);
  
  // Calculate the progression within the current scenario
  const scenarioIndex = Math.min(
    Math.floor(messageCount / 2) + 1, // Every two user messages, progress one step 
    scenarioMessages.length - 1
  );
  
  // Check if we've used all messages in this scenario
  const reachedEndOfScenario = scenarioIndex >= scenarioMessages.length - 1;
  const hasExchangedMultipleMessages = messageCount > 4;
  
  // If we've exchanged several messages and reached the end of this scenario, switch to a new one
  if (reachedEndOfScenario && hasExchangedMultipleMessages) {
    // Get all distinct scenarios we've already used
    const usedScenarios = new Set<string>(
      messages
        .filter(m => m.scenario)
        .map(m => m.scenario as string)
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
      return SCENARIO_MESSAGES.find(msg => 
        msg.scenario === newScenario && 
        msg.text.includes("Hello") || // Try to get an introductory message
        msg.text.includes("Hi there") || 
        msg.text.includes("IMPORTANT")
      ) || SCENARIO_MESSAGES.find(msg => msg.scenario === newScenario);
    }
  }
  
  // Get the message for the current progression in the scenario
  const candidateMessage = scenarioMessages[scenarioIndex];
  
  // Check message history to avoid repetition
  const lastSixMessages = messages.slice(-6).map(m => m.text);
  
  if (candidateMessage && !lastSixMessages.includes(candidateMessage.text)) {
    return candidateMessage;
  } else {
    // Find an alternative message in this scenario that wasn't sent recently
    const alternativeMessage = scenarioMessages.find(msg => !lastSixMessages.includes(msg.text));
    
    if (alternativeMessage) {
      return alternativeMessage;
    } else {
      // Switch to a new scenario if we can't find a non-repeated message
      return findAlternativeScenarioMessage(currentScenario, lastSixMessages);
    }
  }
};

/**
 * Find a message from an alternative scenario
 */
const findAlternativeScenarioMessage = (
  currentScenario: string,
  recentTexts: string[]
): ScenarioMessage | null => {
  // Get all scenarios except current
  const otherScenarios = ['investment', 'banking', 'gift', 'tech', 'romance']
    .filter(s => s !== currentScenario);
  
  // Randomly select a new scenario
  const newScenario = otherScenarios[Math.floor(Math.random() * otherScenarios.length)];
  
  // Get intro messages for this new scenario
  const newScenarioIntros = SCENARIO_MESSAGES.filter(msg => 
    msg.scenario === newScenario && 
    (msg.text.includes("Hello") || 
     msg.text.includes("Hi there") || 
     msg.text.includes("IMPORTANT") ||
     msg.text.includes("URGENT"))
  );
  
  // If we have intro messages that haven't been used recently, use one
  const unusedIntro = newScenarioIntros.find(msg => !recentTexts.includes(msg.text));
  if (unusedIntro) {
    return unusedIntro;
  }
  
  // Otherwise get any message for this scenario that hasn't been used recently
  const newScenarioMessages = SCENARIO_MESSAGES.filter(msg => msg.scenario === newScenario);
  const unusedMessage = newScenarioMessages.find(msg => !recentTexts.includes(msg.text));
  
  if (unusedMessage) {
    return unusedMessage;
  }
  
  // If all else fails, return the first message from the new scenario
  return newScenarioMessages[0] || SCENARIO_MESSAGES[0];
};
