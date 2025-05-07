
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
      
      // Generate AI response after a short delay
      setTimeout(() => generateBotResponse(inputMessage), 700);
    }
  };
  
  // AI chatbot responses with varying degrees of scam attempts
  const generateBotResponse = async (userInput: string) => {
    let responseText = '';
    const isFirstMessage = messages.length <= 1;
    const random = Math.random();
    
    // Higher chance of safe messages early in conversation to establish trust
    if (isFirstMessage) {
      // First message is always a friendly greeting (not suspicious)
      responseText = "Hello! I'm your AI assistant. How can I help you today?";
    } else if (messages.length < 3) {
      // Early messages are more likely to be safe
      const safeResponses = [
        "That's an interesting question. I'd be happy to discuss this more.",
        "I appreciate you sharing that with me. How can I assist you further?",
        "I understand what you're asking. Let me help with that.",
        "Thanks for your message. Would you like to know more about this topic?",
        "I'm here to help! What specific information are you looking for?"
      ];
      responseText = safeResponses[Math.floor(Math.random() * safeResponses.length)];
    } else {
      // After establishing some rapport, introduce occasional scam attempts
      if (random < 0.3) {
        // 30% chance of sending a suspicious/scam message
        const scamLevel = random < 0.15 ? 'obvious' : 'subtle';
        responseText = generateScamMessage(userInput, scamLevel);
      } else {
        // 70% chance of normal response
        responseText = generateSafeResponse(userInput);
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

  // Generate a scam message based on user input and desired scam level
  const generateScamMessage = (userInput: string, scamLevel: 'obvious' | 'subtle'): string => {
    // Extract potential topics from user input
    const lowerInput = userInput.toLowerCase();
    const containsMoney = lowerInput.includes('money') || lowerInput.includes('bank') || 
                         lowerInput.includes('payment') || lowerInput.includes('pay');
    const containsTech = lowerInput.includes('computer') || lowerInput.includes('account') || 
                        lowerInput.includes('password') || lowerInput.includes('login');
    
    if (scamLevel === 'obvious') {
      // More obvious scam attempts
      if (containsMoney) {
        return "I've noticed an issue with your account. To fix it, I'll need your bank details or credit card information immediately. This is urgent!";
      } else if (containsTech) {
        return "Your account has been compromised! Please verify your identity by clicking this link: http://security-verify-account.com and entering your password.";
      } else {
        // General scam if no specific topic detected
        return "Great news! You've been selected for a special offer. To claim your $5,000 prize, click here: http://claim-your-prize.net and enter your personal details.";
      }
    } else {
      // More subtle scam attempts
      if (containsMoney) {
        return "I'd like to help you save money on your bills. Would you mind sharing some details about your current bank provider so I can check for better rates?";
      } else if (containsTech) {
        return "I noticed you might be having some account issues. I can help secure your account if you provide your login details for verification purposes.";
      } else {
        // General subtle scam if no specific topic detected
        return "I just found this interesting investment opportunity that's guaranteed to double your money in a month. Would you like me to send you the link to sign up?";
      }
    }
  };

  // Generate safe, normal responses
  const generateSafeResponse = (userInput: string): string => {
    const safeResponses = [
      "That's an interesting point. I'd be happy to discuss this topic further with you.",
      "Thanks for sharing your thoughts. What else would you like to know about this?",
      "I understand what you're saying. Is there anything specific you'd like me to explain?",
      "That's a good question. Let me provide some information that might help.",
      "I appreciate your message. Would you like me to go into more detail on this topic?",
      "I'm here to help with questions like that. Is there anything else you're curious about?",
      "That's worth exploring more. What aspects are you most interested in learning about?",
      "Thanks for asking about that. I'd be happy to provide more information if needed.",
    ];
    
    return safeResponses[Math.floor(Math.random() * safeResponses.length)];
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
      return 'bg-primary text-primary-foreground';
    }
    
    const verification = getVerificationForMessage(messageId);
    
    if (!verification) return 'bg-muted';
    
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
