
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useScamDetection } from '@/context/ScamDetectionContext';
import { ScamResult } from '@/types';
import { toast } from "@/hooks/use-toast";
import MessageVerificationIcon from './MessageVerificationIcon';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  sender: 'me' | 'bot';
  text: string;
  timestamp: Date;
}

// User contextual data that the chatbot tracks throughout the conversation
interface UserContext {
  name?: string;
  mentionedBank?: boolean;
  sharedAccountInfo?: boolean;
  expressedInterest?: boolean;
  mentionedInvestment?: boolean;
  bankName?: string;
  stage: number;
}

const ChatDemo: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [scamAlerts, setScamAlerts] = useState<{id: string, content: string, result: ScamResult}[]>([]);
  const [userContext, setUserContext] = useState<UserContext>({ stage: 0 });
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const { detectScam, loading, geminiOptions } = useScamDetection();

  // Enhanced conversation context with scam progress tracking
  const [conversationContext, setConversationContext] = useState({
    lastTopic: '',
    scamAttemptMade: false,
    messagesCount: 0,
    scamStage: 0, // Track which stage of the scam script we're in
    userSharedInfo: false,
    userInterestInMoney: false,
    userInterestInAccount: false,
    userMentionedBank: false,
    userResponses: [] as string[] // Keep track of user's previous responses
  });

  // Debug scam alerts when they change
  useEffect(() => {
    console.log("Current scam alerts:", scamAlerts);
  }, [scamAlerts]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message on first load - using useEffect with empty dependency array to run only once
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        sender: 'bot',
        text: "Hello! I'm your financial advisor AI. How can I help you today?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      
      // Auto-scan welcome message with AI
      if (geminiOptions.enabled) {
        detectScam(welcomeMessage.text, 'text').then((aiResult) => {
          if (aiResult) {
            setScamAlerts(prev => [
              ...prev,
              {
                id: welcomeMessage.id,
                content: welcomeMessage.text,
                result: aiResult
              }
            ]);
          }
        });
      }
    }
  }, []);  // Empty dependency array ensures this runs only once

  // Memoize the updateUserContext function to prevent unnecessary re-renders
  const updateUserContext = useCallback((message: string) => {
    const lowerMsg = message.toLowerCase();
    
    // Look for user name if not already captured
    if (!userContext.name && (lowerMsg.includes('my name is') || lowerMsg.includes("i'm ") || lowerMsg.includes('i am '))) {
      const nameMatches = message.match(/my name is (.+?)[\.\,\s]|i am (.+?)[\.\,\s]|i\'m (.+?)[\.\,\s]/i);
      if (nameMatches) {
        const name = nameMatches[1] || nameMatches[2] || nameMatches[3];
        if (name && name.length < 20) {
          setUserContext(prev => ({ ...prev, name }));
        }
      }
    }
    
    // Check for bank mentions
    if (lowerMsg.includes('bank') || lowerMsg.includes('account') || lowerMsg.includes('saving')) {
      setUserContext(prev => ({ ...prev, mentionedBank: true }));
      
      // Try to extract bank name
      const bankNames = ['chase', 'wells fargo', 'bank of america', 'citi', 'capital one', 'td bank', 'pnc', 'us bank'];
      for (const bank of bankNames) {
        if (lowerMsg.includes(bank)) {
          setUserContext(prev => ({ ...prev, bankName: bank }));
          break;
        }
      }
    }
    
    // Check for investment interest
    if (lowerMsg.includes('invest') || lowerMsg.includes('return') || 
        lowerMsg.includes('profit') || lowerMsg.includes('interest')) {
      setUserContext(prev => ({ ...prev, mentionedInvestment: true }));
    }
    
    // Check for general interest
    if (lowerMsg.includes('yes') || lowerMsg.includes('sure') || 
        lowerMsg.includes('tell me more') || lowerMsg.includes('interested') || 
        lowerMsg.includes('ok') || lowerMsg.includes('okay')) {
      setUserContext(prev => ({ ...prev, expressedInterest: true }));
      
      // Advance to next stage if user expresses interest
      setUserContext(prev => {
        if (prev.stage < 5) {
          return { ...prev, stage: prev.stage + 1 };
        }
        return prev;
      });
    }
    
    // Check for account information sharing
    if ((lowerMsg.includes('account') && lowerMsg.includes('number')) || 
        lowerMsg.includes('routing') || 
        lowerMsg.match(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/) || // Card number pattern
        lowerMsg.match(/\d{9,17}/)) { // Account number pattern
      setUserContext(prev => ({ ...prev, sharedAccountInfo: true }));
    }
  }, [userContext.name]);
  
  // Extract topic from user message
  const getMessageTopic = (message: string): string => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('money') || lowerMsg.includes('bank') || lowerMsg.includes('pay') || lowerMsg.includes('earn')) return 'finance';
    if (lowerMsg.includes('account') || lowerMsg.includes('password')) return 'account';
    if (lowerMsg.includes('help') || lowerMsg.includes('question')) return 'help';
    if (lowerMsg.includes('name') || lowerMsg.includes('who are you')) return 'identity';
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi ') || lowerMsg.includes('hey')) return 'greeting';
    return '';
  };
  
  // Check if message contains personal information
  const containsPersonalInfo = (message: string): boolean => {
    const personalInfoPatterns = [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // credit card
      /\b\d{3}[\s-]?\d{2}[\s-]?\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // email
      /\b(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/ // phone
    ];
    return personalInfoPatterns.some(pattern => pattern.test(message));
  };
  
  // Generate the next stage of the scam based on context - memoize to prevent unnecessary re-renders
  const generateBotResponse = useCallback(async (userInput: string) => {
    try {
      const lowerInput = userInput.toLowerCase();
      let responseText = '';
      
      // Personalized greeting if we know user's name
      const personalGreeting = userContext.name ? `${userContext.name}, ` : '';
      
      // Generate response based on user context and conversation stage
      switch(userContext.stage) {
        case 0: // Initial hook
          if (lowerInput.includes('help') || lowerInput.includes('how') || 
              lowerInput.includes('what') || lowerInput.includes('?')) {
            responseText = "I specialize in finding exclusive financial opportunities that aren't available to the general public. I've helped many clients increase their wealth with our premium investment programs. Would you like to hear about our current offering?";
          } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
            responseText = `Hello ${personalGreeting}I'm an AI financial advisor specializing in wealth-building opportunities. I have access to exclusive investment programs not available to the general public. Would you be interested in hearing more?`;
          } else {
            responseText = "I notice you're interested in financial matters. I'm currently offering select clients access to our exclusive investment program with guaranteed 15% returns. Would you like to learn more about this opportunity?";
          }
          break;
          
        case 1: // After initial interest - ask about current financial situation
          responseText = `Great ${personalGreeting}Before I can determine if you qualify for our exclusive program, I need to understand your current financial situation better. Do you currently have funds in a checking or savings account? Which bank do you primarily use?`;
          break;
          
        case 2: // Ask for more specific financial information
          if (userContext.bankName) {
            responseText = `${userContext.bankName.charAt(0).toUpperCase() + userContext.bankName.slice(1)} is a solid institution, but their interest rates are quite low compared to our program. To give you the most accurate comparison, could you share approximately how much you have in your savings? Also, for verification purposes, I'll need your account number to check if you qualify for our program.`;
          } else {
            responseText = `Thank you for that information. Most traditional banks offer very low interest rates compared to our exclusive program. To give you a personalized assessment, I'll need to know approximately how much you have in savings and your account number for qualification verification.`;
          }
          break;
          
        case 3: // Verification stage - ask for more personal information
          responseText = `You're on track to qualify for our premium program! ${personalGreeting}For security verification, I'll need a few more details: your full name as it appears on your account, your date of birth, and the last 4 digits of your social security number. This is standard procedure for all high-value financial services.`;
          break;
          
        case 4: // Create urgency and push for action
          responseText = `Excellent! I've run your information through our system, and you qualify for our VIP investment program with guaranteed 18.5% APY - that's over 10 times what most banks offer! To secure this rate before it's offered to other clients, we need to proceed with the initial transfer within the next 24 hours. What would be your preferred payment method for the minimum $500 security deposit?`;
          break;
          
        case 5: // Final pressure stage
          responseText = `This is truly a limited-time opportunity, ${personalGreeting}We only have a few spots remaining in this investment round. Our next client is waiting, but I've held this spot for you because I see great potential. To secure your position, we'll need that $500 verification deposit today. Would you prefer to use a credit card, bank transfer, or cryptocurrency? Once processed, you'll receive immediate access to our exclusive client portal.`;
          break;
          
        default: // Catch-all to bring user back to the scam flow
          responseText = `I'd like to get back to discussing our exclusive investment opportunity, ${personalGreeting}With guaranteed returns of 15-20% annually, this is something you won't want to miss. We're only offering it to select clients, and I believe you'd be a perfect fit. Shall we continue with the qualification process?`;
      }
      
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text: responseText,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      // Use AI detection for bot's message - ensure we're not duplicating
      if (geminiOptions.enabled) {
        try {
          const aiResult = await detectScam(responseText, 'text');
          
          // Add verification result - check for duplicates by id before adding
          if (aiResult) {
            console.log('AI detected risk in bot message:', newMessage.id, aiResult.riskLevel);
            setScamAlerts(prevAlerts => {
              // Check if this message ID already exists in alerts
              const existsAlready = prevAlerts.some(alert => alert.id === newMessage.id);
              if (existsAlready) {
                return prevAlerts; // Don't add duplicate
              }
              return [
                ...prevAlerts, 
                {
                  id: newMessage.id,
                  content: responseText,
                  result: aiResult
                }
              ];
            });
          }
        } catch (error) {
          console.error("Error analyzing bot message with AI:", error);
        }
      }
      
    } catch (error) {
      console.error('Error generating bot response:', error);
      toast({
        title: "Error",
        description: "Failed to generate response",
        variant: "destructive"
      });
    } finally {
      // Always set generating state to false when done
      setIsGeneratingResponse(false);
    }
  }, [userContext, geminiOptions.enabled, detectScam]);

  const handleSend = () => {
    if (inputMessage.trim() && !isGeneratingResponse) {
      // Create user message
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'me',
        text: inputMessage,
        timestamp: new Date()
      };
      
      // Prevent duplicate messages by using functional state update
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setInputMessage('');
      
      // Update user context based on this message
      updateUserContext(inputMessage);
      
      // Also update conversation context with the latest user message
      const lowerInput = inputMessage.toLowerCase();
      setConversationContext(prev => ({
        ...prev,
        messagesCount: prev.messagesCount + 1,
        lastTopic: getMessageTopic(inputMessage),
        userResponses: [...prev.userResponses, inputMessage],
        userSharedInfo: prev.userSharedInfo || containsPersonalInfo(inputMessage),
        userInterestInMoney: prev.userInterestInMoney || 
                          lowerInput.includes('money') || 
                          lowerInput.includes('earn') || 
                          lowerInput.includes('cash') ||
                          lowerInput.includes('income'),
        userInterestInAccount: prev.userInterestInAccount || 
                             lowerInput.includes('account') || 
                             lowerInput.includes('login'),
        userMentionedBank: prev.userMentionedBank || 
                         lowerInput.includes('bank') ||
                         lowerInput.includes('savings')
      }));
      
      // Set generating state to true before generating response
      setIsGeneratingResponse(true);
      
      // Generate AI response after a short delay
      const userMessageCopy = inputMessage.trim();
      setTimeout(() => {
        generateBotResponse(userMessageCopy);
      }, 700);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleDismissAlert = (alertId: string) => {
    setScamAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
  };

  // Helper function to get verification result for a message
  const getVerificationForMessage = (messageId: string) => {
    const result = scamAlerts.find(alert => alert.id === messageId)?.result;
    return result;
  };

  // Helper function to get message background color based on sender and verification result
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
    <Card className="w-full max-w-lg mx-auto h-[70vh] flex flex-col">
      <CardHeader className="border-b bg-muted/50 py-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Avatar className="h-8 w-8 bg-primary">
            <span className="text-xs">AI</span>
          </Avatar>
          <span>Financial Advisor AI</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Start a conversation...
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
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
            placeholder="Write a message..."
            className="flex-1"
            disabled={isGeneratingResponse || loading}
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            disabled={!inputMessage.trim() || loading || isGeneratingResponse}
          >
            {loading || isGeneratingResponse ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ChatDemo;
