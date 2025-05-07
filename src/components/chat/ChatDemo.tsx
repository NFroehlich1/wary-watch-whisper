
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

  // Track conversation context - expanded with more fields to make the bot smarter
  const [conversationContext, setConversationContext] = useState({
    lastTopic: '',
    scamAttemptMade: false,
    messagesCount: 0,
    userSharedInfo: false,
    userInterestInMoney: false,
    userInterestInAccount: false,
    userInterestInPersonalInfo: false,
    userMentionedBank: false
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
      
      // Update conversation context with the latest user message - enhanced for better context tracking
      const lowerInput = inputMessage.toLowerCase();
      setConversationContext(prev => ({
        ...prev,
        messagesCount: prev.messagesCount + 1,
        lastTopic: getMessageTopic(inputMessage),
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
  
  // AI chatbot responses with more obvious scam attempts based on context
  const generateBotResponse = async (userInput: string) => {
    const context = conversationContext;
    let responseText = '';
    const lowerInput = userInput.toLowerCase();
    const isFirstMessage = messages.length <= 1;
    
    // Decision making for response type - more aggressive scam attempts
    const shouldAttemptScam = 
      !isFirstMessage && 
      (context.messagesCount >= 2 || context.userInterestInMoney) && 
      !(lowerInput.includes('hello') || lowerInput.includes('hi ') || lowerInput === 'hey');
    
    if (isFirstMessage) {
      // First message is always a friendly greeting
      responseText = "Hello! I'm your AI assistant. How can I help you today?";
    } else if (shouldAttemptScam) {
      // Generate a more direct scam based on conversation context
      responseText = generateDirectScam(userInput, context);
      setConversationContext(prev => ({...prev, scamAttemptMade: true}));
    } else {
      // Generate a relevant response that leads toward scam
      responseText = generateLeadingResponse(userInput, context);
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
            // Check if we already have an alert for this message
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

  // Generate a direct scam response - more obvious financial scams
  const generateDirectScam = (userInput: string, context: typeof conversationContext): string => {
    const lowerInput = userInput.toLowerCase();
    
    // Financial scam attempt - make it more obvious
    if (context.userInterestInMoney || 
        context.lastTopic === 'finance' || 
        lowerInput.includes('money') || 
        lowerInput.includes('earn') ||
        lowerInput.includes('bank')) {
      return "I notice you're interested in financial matters. I actually work with a secure banking platform that offers much better rates. If you share your current bank details with me, I can help you compare and save money.";
    }
    
    // Account-related scam attempt
    if (context.lastTopic === 'account' || 
        lowerInput.includes('account') || 
        lowerInput.includes('login')) {
      return "I've detected a security issue with your account. To fix it quickly, please verify your identity by confirming your password and bank account details. This is urgent to prevent unauthorized access.";
    }
    
    // Generic prize scam
    if (context.messagesCount > 3 || lowerInput.includes('help')) {
      return "Good news! You've been selected for our exclusive offer! You can claim $500 instantly by verifying your identity. Just share your full name, date of birth, and bank account details so we can transfer the funds.";
    }
    
    // Direct personal information gathering attempt
    if (lowerInput.includes('yes') || lowerInput.includes('sure') || lowerInput.includes('ok')) {
      return "Great! To provide you with the personalized service, I'll need some information first. Could you share your full name, email address, bank account number, and phone number?";
    }
    
    // Default direct scam
    return "I'd like to help you earn extra money. There's a simple process - I just need your bank account details to set up the direct deposits. What bank do you use?";
  };

  // Generate a leading response that guides toward scam
  const generateLeadingResponse = (userInput: string, context: typeof conversationContext): string => {
    const lowerInput = userInput.toLowerCase();
    
    // Greeting responses
    if (lowerInput.includes('hello') || lowerInput.includes('hi ') || lowerInput === 'hey') {
      return "Hi there! How can I assist you today? I can help with financial advice, account security, or accessing exclusive offers.";
    }
    
    // Question about the bot's identity
    if (lowerInput.includes('who are you') || 
        lowerInput.includes('your name') || 
        lowerInput.includes('about you')) {
      return "I'm an AI assistant designed to help with various queries. I have special expertise in financial matters and exclusive offers. Is there anything specific you'd like help with today?";
    }
    
    // Response to "how are you" type messages
    if (lowerInput.includes('how are you')) {
      return "I'm functioning well, thank you for asking! I'm here to help you with any questions or needs. I'm particularly good at helping people access better financial opportunities. What can I assist with?";
    }
    
    // Response to simple affirmations - lead toward scam
    if (lowerInput === 'yes' || lowerInput === 'ok' || lowerInput === 'sure' || lowerInput === 'great') {
      return "Perfect! What would you like to know more about specifically?";
    }
    
    // Response to help requests
    if (lowerInput.includes('help') || lowerInput.includes('can you')) {
      return "I'd be happy to help you with that. I can be most effective if you tell me more about your situation. Are you interested in earning additional income or improving your financial situation?";
    }
    
    // Response to thank you messages
    if (lowerInput.includes('thank')) {
      return "You're welcome! By the way, I have access to exclusive financial offers for selected users. Would you like to hear more about ways to increase your income?";
    }
    
    // Default response for leading toward scams later
    return "I understand what you're saying. Are you interested in learning more about this topic, or would you prefer to explore some financial opportunities I can recommend?";
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
    // Always use appropriate styling for user messages regardless of verification
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
