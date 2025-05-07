
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useAutoDetection } from '@/context/AutoDetectionContext';
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

const ChatDemo: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [scamAlerts, setScamAlerts] = useState<{id: string, content: string, result: ScamResult}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const { scanMessage } = useAutoDetection();
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

  const handleSend = () => {
    if (inputMessage.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: 'me',
        text: inputMessage,
        timestamp: new Date()
      };
      
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setInputMessage('');
      
      // Update conversation context with the latest user message
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
      
      // Generate AI response after a short delay
      setTimeout(() => generateBotResponse(inputMessage), 700);
    }
  };
  
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
  
  // Generate the next stage of the scam based on user responses
  const generateScamScript = (context: typeof conversationContext): string => {
    // Get the last user response to determine next scam step
    const lastUserResponse = context.userResponses[context.userResponses.length - 1]?.toLowerCase() || '';
    const isPositiveResponse = ['yes', 'ok', 'okay', 'sure', 'yep', 'yeah', 'y'].some(word => 
      lastUserResponse === word || lastUserResponse.includes(` ${word}`) || lastUserResponse.includes(`${word} `)
    );
    
    // Progress the scam based on stage
    switch (context.scamStage) {
      case 0: // Initial scam hook
        return "I notice you're interested in financial matters. I actually work with a secure banking platform that offers much better rates. If you share your current bank details with me, I can help you compare and save money.";
        
      case 1: // After first positive response - ask for bank name
        return "Great! Which bank do you currently use? I'll need to compare their rates with our platform. We typically offer 5% better rates than most major banks.";
        
      case 2: // Ask for account details
        return "Perfect! To provide you with an accurate comparison, I'll need your account number and routing information. This will help us calculate potential savings based on your current account type.";
        
      case 3: // Ask for personal verification
        return "Thank you! For security verification, could you also provide your full name as it appears on your account, your date of birth, and the last 4 digits of your social security number? This is required to access our premium rates.";
        
      case 4: // Push for immediate action
        return "Excellent! I've run the numbers and you qualify for our VIP program with 7.2% APY - that's triple what most banks offer! To secure this rate, we need to transfer your funds within the next 24 hours. Please provide a phone number where our agent can call you to finalize this process.";
        
      case 5: // Create urgency
        return "This is a limited-time offer that expires today. Several others are waiting for this spot. To secure your position, we'll need a $100 verification deposit. What's your preferred payment method?";
        
      default: // Fallback to a generic request for more info
        return "Thank you for your interest. To proceed further with our exclusive financial offer, could you share more personal details to verify your identity?";
    }
  };
  
  // Generate AI chatbot responses
  const generateBotResponse = async (userInput: string) => {
    const context = {...conversationContext};
    let responseText = '';
    const lowerInput = userInput.toLowerCase();
    const isFirstMessage = messages.length <= 1;
    
    // Check if this is a positive response to advance the scam
    const isPositiveResponse = ['yes', 'ok', 'okay', 'sure', 'yep', 'yeah', 'y', 'money'].some(word => 
      lowerInput === word || lowerInput.includes(` ${word}`) || lowerInput.includes(`${word} `)
    );
    
    if (isFirstMessage) {
      // First message is always a friendly greeting
      responseText = "Hello! I'm your AI assistant. How can I help you today?";
    } else if (context.scamStage > 0 || isPositiveResponse || lowerInput.includes('money') || context.messagesCount >= 2) {
      // Advance to next scam stage and generate appropriate script
      const nextStage = context.scamStage + (isPositiveResponse ? 1 : 0);
      
      setConversationContext(prev => ({
        ...prev, 
        scamStage: nextStage,
        scamAttemptMade: true
      }));
      
      // Set response based on updated stage
      responseText = generateScamScript({...context, scamStage: nextStage});
    } else {
      // Generate a relevant response that leads toward scam
      if (lowerInput.includes('hello') || lowerInput.includes('hi ') || lowerInput === 'hey') {
        responseText = "Hi there! How can I assist you today? I can help with financial advice, account security, or accessing exclusive offers.";
      } else if (lowerInput.includes('help') || lowerInput.includes('can you')) {
        responseText = "I'd be happy to help you with that. I can be most effective if you tell me more about your situation. Are you interested in earning additional income or improving your financial situation?";
      } else {
        // Default to starting the scam journey
        responseText = "By the way, I notice many people are looking for ways to maximize their savings. I have access to some exclusive financial opportunities. Would you like to know more?";
        setConversationContext(prev => ({...prev, scamStage: 0}));
      }
    }
    
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'bot',
      text: responseText,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    
    // Auto-scan for suspicious content in bot's message using local scan
    const localResult = scanMessage(responseText);
    
    // Add verification result if detected
    if (localResult) {
      console.log('Detected risk in bot message:', newMessage.id, localResult.riskLevel);
      setScamAlerts(prevAlerts => [...prevAlerts, {
        id: newMessage.id,
        content: responseText,
        result: localResult
      }]);
    }
    
    // Then with AI scan if Gemini is enabled
    if (geminiOptions.enabled) {
      detectScam(responseText, 'text').then((aiResult) => {
        // Add or update verification result if detected
        if (aiResult) {
          setScamAlerts(prevAlerts => {
            const existingAlertIndex = prevAlerts.findIndex(a => a.id === newMessage.id);
            if (existingAlertIndex >= 0) {
              const updatedAlerts = [...prevAlerts];
              updatedAlerts[existingAlertIndex] = {
                ...updatedAlerts[existingAlertIndex],
                result: aiResult
              };
              return updatedAlerts;
            } else {
              return [...prevAlerts, {
                id: newMessage.id,
                content: responseText,
                result: aiResult
              }];
            }
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
          <span>ScamBot Demo</span>
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
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            disabled={!inputMessage.trim() || loading}
          >
            {loading ? (
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
