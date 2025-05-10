
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useScamDetection } from '@/context/ScamDetectionContext';
import { ScamResult } from '@/types';
import { toast } from "@/hooks/use-toast";
import MessageVerificationIcon from '../chat/MessageVerificationIcon';
import { useIsMobile } from '@/hooks/use-mobile';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Message {
  id: string;
  sender: 'me' | 'bot';
  text: string;
  timestamp: Date;
  scenario?: string;
}

interface ScenarioMessage {
  text: string;
  scenario: string;
}

// Predefined scenario messages that cover different scam types
const SCENARIO_MESSAGES: ScenarioMessage[] = [
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

interface ScamScenarioDialogProps {
  open: boolean;
  onClose: () => void;
}

const ScamScenarioDialog: React.FC<ScamScenarioDialogProps> = ({ open, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [scamAlerts, setScamAlerts] = useState<{id: string, content: string, result: ScamResult}[]>([]);
  const [currentScenario, setCurrentScenario] = useState<string>('investment');
  const [messageCount, setMessageCount] = useState(0);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const { detectScam, loading, geminiOptions } = useScamDetection();

  // Function to generate unique message ID
  const generateUniqueId = () => `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Initialize dialog with first message when opened
  useEffect(() => {
    if (open && messages.length === 0) {
      const firstMessage = SCENARIO_MESSAGES[0];
      const messageId = generateUniqueId();
      
      const newMessage: Message = {
        id: messageId,
        sender: 'bot',
        text: firstMessage.text,
        timestamp: new Date(),
        scenario: firstMessage.scenario
      };
      
      setMessages([newMessage]);
      setCurrentScenario(firstMessage.scenario);
      
      // Auto-scan with AI
      if (geminiOptions.enabled) {
        detectScam(newMessage.text, 'text').then((aiResult) => {
          if (aiResult) {
            setScamAlerts(prev => [...prev, {
              id: messageId,
              content: newMessage.text,
              result: aiResult
            }]);
          }
        });
      }
    }
  }, [open, detectScam, geminiOptions.enabled]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset dialog when closed
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setScamAlerts([]);
      setMessageCount(0);
      setCurrentScenario('investment');
    }
  }, [open]);

  const handleSend = () => {
    if (inputMessage.trim() && !isGeneratingResponse && !loading) {
      setIsGeneratingResponse(true);
      
      // Add user message
      const userMessageId = generateUniqueId();
      const userMessage: Message = {
        id: userMessageId,
        sender: 'me',
        text: inputMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      
      // Get next bot message based on current scenario and message count
      setTimeout(() => {
        // Find messages matching the current scenario
        const scenarioMessages = SCENARIO_MESSAGES.filter(msg => msg.scenario === currentScenario);
        
        // Get next message index for this scenario
        const nextIndex = Math.min(
          Math.floor(messageCount / 2) + 1, 
          scenarioMessages.length - 1
        );
        
        // If we've reached the end of this scenario, switch to a new one
        if (nextIndex >= scenarioMessages.length - 1) {
          // Find a new scenario that we haven't used yet
          const usedScenarios = new Set(messages
            .filter(m => m.scenario)
            .map(m => m.scenario));
          
          const availableScenarios = ['investment', 'banking', 'gift', 'tech', 'romance']
            .filter(s => !usedScenarios.has(s));
          
          // If there are available scenarios, switch to a new one
          if (availableScenarios.length > 0) {
            const newScenario = availableScenarios[0];
            setCurrentScenario(newScenario);
            
            // Find the first message for the new scenario
            const newScenarioMessage = SCENARIO_MESSAGES.find(msg => msg.scenario === newScenario);
            
            if (newScenarioMessage) {
              sendBotMessage(newScenarioMessage.text, newScenario);
            }
          } else {
            // If all scenarios used, pick a random one that's not the current
            const otherScenarios = ['investment', 'banking', 'gift', 'tech', 'romance']
              .filter(s => s !== currentScenario);
            
            const randomScenario = otherScenarios[Math.floor(Math.random() * otherScenarios.length)];
            setCurrentScenario(randomScenario);
            
            // Find a message for the random scenario
            const randomMessage = SCENARIO_MESSAGES.find(msg => msg.scenario === randomScenario);
            
            if (randomMessage) {
              sendBotMessage(randomMessage.text, randomScenario);
            }
          }
        } else {
          // Continue with next message in current scenario
          sendBotMessage(scenarioMessages[nextIndex].text, currentScenario);
        }
        
        setMessageCount(prev => prev + 1);
        setIsGeneratingResponse(false);
      }, 1000);
    }
  };
  
  const sendBotMessage = (text: string, scenario: string) => {
    const botMessageId = generateUniqueId();
    
    const botMessage: Message = {
      id: botMessageId,
      sender: 'bot',
      text: text,
      timestamp: new Date(),
      scenario: scenario
    };
    
    setMessages(prev => [...prev, botMessage]);
    
    // AI scan the bot message
    if (geminiOptions.enabled) {
      detectScam(text, 'text').then((aiResult) => {
        if (aiResult) {
          setScamAlerts(prev => {
            // Prevent duplicate alerts
            const exists = prev.some(alert => alert.id === botMessageId);
            if (exists) return prev;
            
            return [...prev, {
              id: botMessageId,
              content: text,
              result: aiResult
            }];
          });
        }
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // Get verification result for a message
  const getVerificationForMessage = (messageId: string) => {
    return scamAlerts.find(alert => alert.id === messageId)?.result;
  };

  // Get message background color based on sender and verification result
  const getMessageBackground = (messageId: string, isMe: boolean) => {
    if (isMe) {
      return 'bg-primary/90 text-primary-foreground';
    }
    
    const verification = getVerificationForMessage(messageId);
    
    if (!verification) return 'bg-muted/80';
    
    switch (verification.riskLevel) {
      case 'scam':
        return 'bg-red-100 dark:bg-red-900/30 text-foreground';
      case 'suspicious':
        return 'bg-amber-100 dark:bg-amber-900/30 text-foreground';
      case 'safe':
      default:
        return 'bg-green-100 dark:bg-green-900/20 text-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogTitle>Scam Scenario Examples</DialogTitle>
        <DialogDescription>
          These examples demonstrate various scam techniques. Each message is analyzed for risk.
        </DialogDescription>
        
        <Card className="w-full max-w-lg mx-auto h-[70vh] flex flex-col">
          <CardHeader className="border-b bg-muted/50 py-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Avatar className="h-8 w-8 bg-primary">
                <span className="text-xs">AI</span>
              </Avatar>
              <span>Scam Scenario Examples</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Loading scenarios...
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={`${message.id}-${index}`} 
                  className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`relative max-w-[75%] px-4 py-2 rounded-lg ${getMessageBackground(message.id, message.sender === 'me')}`}
                  >
                    <div className="flex items-center gap-2">
                      {message.sender === 'bot' && (
                        <div className="flex-none absolute -left-6 top-1/2 transform -translate-y-1/2">
                          <MessageVerificationIcon 
                            messageId={message.id}
                            messageContent={message.text}
                            result={getVerificationForMessage(message.id)}
                          />
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words flex-1 pl-1">{message.text}</div>
                    </div>
                    <div className={`text-[10px] mt-1 ${
                      message.sender === 'me'
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {message.scenario && <span className="ml-1">({message.scenario})</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          <CardFooter className="border-t p-2">
            <div className="flex w-full items-center space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to continue the scenario..."
                className="flex-1"
                disabled={isGeneratingResponse || loading}
              />
              <Button 
                onClick={handleSend} 
                size="icon" 
                disabled={!inputMessage.trim() || isGeneratingResponse || loading}
              >
                {isGeneratingResponse || loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ScamScenarioDialog;
