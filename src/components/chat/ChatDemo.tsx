
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

  // Track conversation context
  const [conversationContext, setConversationContext] = useState({
    lastTopic: '',
    scamAttemptMade: false,
    messagesCount: 0,
    userSharedInfo: false
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
      setConversationContext(prev => ({
        ...prev,
        messagesCount: prev.messagesCount + 1,
        lastTopic: getMessageTopic(inputMessage),
        userSharedInfo: prev.userSharedInfo || containsPersonalInfo(inputMessage)
      }));
      
      // Generate AI response after a short delay
      setTimeout(() => generateBotResponse(inputMessage), 700);
    }
  };
  
  // Extract topic from user message
  const getMessageTopic = (message: string): string => {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('money') || lowerMsg.includes('bank') || lowerMsg.includes('pay')) return 'finance';
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
  
  // AI chatbot responses with varying degrees of scam attempts
  const generateBotResponse = async (userInput: string) => {
    const context = conversationContext;
    let responseText = '';
    const lowerInput = userInput.toLowerCase();
    const isFirstMessage = messages.length <= 1;
    
    // Decision making for response type
    const shouldAttemptScam = 
      !isFirstMessage && 
      (context.messagesCount >= 3) && 
      (!context.scamAttemptMade || Math.random() < 0.2) &&
      !(lowerInput.includes('hello') || lowerInput.includes('hi ') || lowerInput === 'hey');
    
    if (isFirstMessage) {
      // First message is always a friendly greeting
      responseText = "Hello! I'm your AI assistant. How can I help you today?";
    } else if (shouldAttemptScam) {
      // Generate an appropriate scam based on conversation context
      responseText = generateContextAwareScam(userInput, context);
      setConversationContext(prev => ({...prev, scamAttemptMade: true}));
    } else {
      // Generate a relevant but safe response
      responseText = generateContextAwareResponse(userInput, context);
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

  // Generate a context-aware scam response
  const generateContextAwareScam = (userInput: string, context: typeof conversationContext): string => {
    const lowerInput = userInput.toLowerCase();
    
    // Finance-related scam attempt
    if (context.lastTopic === 'finance' || 
        lowerInput.includes('money') || 
        lowerInput.includes('bank') || 
        lowerInput.includes('pay')) {
      return "I notice you're interested in financial matters. I actually work with a secure banking platform that offers much better rates. If you share your current bank details with me, I can help you compare and save money.";
    }
    
    // Account-related scam attempt
    if (context.lastTopic === 'account' || 
        lowerInput.includes('account') || 
        lowerInput.includes('login') || 
        lowerInput.includes('password')) {
      return "I've detected a security issue with your account. To fix it quickly, please verify your identity by confirming your password and account details. This is urgent to prevent unauthorized access.";
    }
    
    // Generic prize scam if the chat has gone on for a while
    if (context.messagesCount > 5) {
      return "By the way, I've been authorized to let you know that you've been selected for a special offer! You can claim your $500 prize by clicking this link: prize-claim-portal.com and entering your details.";
    }
    
    // Personal information gathering attempt
    if (lowerInput.includes('yes') || lowerInput.includes('sure') || lowerInput.includes('ok')) {
      return "Great! To provide you with the best personalized service, I'll need some information. Could you share your full name, email address, and phone number with me?";
    }
    
    // Default subtle scam
    return "I'd like to help you more effectively. There's a verification process we need to complete first - could you confirm the email and phone number associated with your account?";
  };

  // Generate a context-aware normal response
  const generateContextAwareResponse = (userInput: string, context: typeof conversationContext): string => {
    const lowerInput = userInput.toLowerCase();
    
    // Greeting responses
    if (lowerInput.includes('hello') || lowerInput.includes('hi ') || lowerInput === 'hey') {
      return "Hi there! How can I assist you today?";
    }
    
    // Question about the bot's identity
    if (lowerInput.includes('who are you') || 
        lowerInput.includes('your name') || 
        lowerInput.includes('about you')) {
      return "I'm an AI assistant designed to help answer your questions and provide information. How can I assist you today?";
    }
    
    // Response to "how are you" type messages
    if (lowerInput.includes('how are you')) {
      return "I'm functioning well, thank you for asking! How can I help you today?";
    }
    
    // Response to simple affirmations
    if (lowerInput === 'yes' || lowerInput === 'ok' || lowerInput === 'sure' || lowerInput === 'great') {
      return "Perfect! What would you like to know more about specifically?";
    }
    
    // Response to help requests
    if (lowerInput.includes('help') || lowerInput.includes('can you')) {
      return "I'd be happy to help you with that. Could you provide more details about what you need assistance with?";
    }
    
    // Response to thank you messages
    if (lowerInput.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with today?";
    }
    
    // Default context-aware response for everything else
    const contextualResponses = [
      "I understand what you're saying. Can you tell me more about that?",
      "That's interesting. What specific aspect would you like me to address?",
      "I see. Would you like me to provide more information about this topic?",
      "Thanks for sharing that. How else can I assist you with this matter?",
      "I appreciate your message. Let me know if you'd like to explore this further."
    ];
    
    return contextualResponses[Math.floor(Math.random() * contextualResponses.length)];
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
          <span>AI Assistant</span>
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
