
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import ScamAlertBanner from '../alerts/ScamAlertBanner';
import { useAutoDetection } from '@/context/AutoDetectionContext';
import { useScamDetection } from '@/context/ScamDetectionContext';
import { ScamResult } from '@/types';
import { toast } from "@/hooks/use-toast";
import MessageVerificationIcon from './MessageVerificationIcon';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  sender: 'me' | 'friend';
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
      
      // Check if my own message contains suspicious content
      // First with local scan
      const myMessageResult = scanMessage(inputMessage);
      
      // Add verification result to scamAlerts if detected
      if (myMessageResult) {
        console.log('Detected risk in own message:', newMessage.id, myMessageResult.riskLevel);
        setScamAlerts(prevAlerts => [...prevAlerts, {
          id: newMessage.id,
          content: inputMessage,
          result: myMessageResult
        }]);
      }
      
      // Then with AI scan if Gemini is enabled
      if (geminiOptions.enabled) {
        toast({
          title: "AI Analysis Running",
          description: "Your message is being checked for suspicious content...",
          duration: 2000,
        });
        
        // FIX: Don't check the return value of detectScam (which is void)
        // Instead, use a .then() pattern to handle the result
        detectScam(inputMessage, 'text').then((aiResult) => {
          // AI analysis complete
          console.log('AI verification result for message:', newMessage.id, aiResult);
          
          if (aiResult) {
            setScamAlerts(prevAlerts => {
              // Update existing alert or add new one
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
                  content: inputMessage,
                  result: aiResult
                }];
              }
            });
          }
          
          toast({
            title: "AI Analysis Complete",
            description: "Your message has been verified.",
            duration: 2000,
          });
        });
      }
      
      setInputMessage('');
      
      // Simulate friend's response after a delay
      setTimeout(() => simulateFriendResponse(), 1500);
    }
  };
  
  // Simulate friend's response with potentially suspicious messages
  const simulateFriendResponse = () => {
    let responseText = '';
    const randomResponse = Math.random();
    
    if (messages.length === 0) {
      responseText = "Hello! How are you? Nice to chat with you here.";
    } else if (randomResponse < 0.2) {
      // 20% chance of sending a suspicious message
      const suspiciousMessages = [
        "Hey, can you help me with something quickly? I urgently need your password for an important matter. It's very urgent!",
        "Click here to claim your prize: http://suspicious-fake-site.com/claim-prize?user=you",
        "I received an urgent message from the bank. You need to verify immediately: http://bank-secure-verify.net/urgent",
        "Your credit card has been blocked! Verify your details here: http://verify-bank-account.com",
        "Hey, check out this great offer! You can earn $5000. Click here: http://get-rich-quick.net/offer"
      ];
      responseText = suspiciousMessages[Math.floor(Math.random() * suspiciousMessages.length)];
      
    } else {
      // Normal responses
      const normalResponses = [
        "Cool, thanks for the info!",
        "How was your day?",
        "Have you heard the latest news?",
        "Want to meet up this weekend?",
        "I just watched a great movie.",
        "Do you know a good restaurant nearby?"
      ];
      responseText = normalResponses[Math.floor(Math.random() * normalResponses.length)];
    }
    
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'friend',
      text: responseText,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, newMessage]);
    
    // Auto-scan for suspicious content in friend's message using local scan
    const localResult = scanMessage(responseText);
    
    // Add verification result if detected
    if (localResult) {
      console.log('Detected risk in friend message:', newMessage.id, localResult.riskLevel);
      setScamAlerts(prevAlerts => [...prevAlerts, {
        id: newMessage.id,
        content: responseText,
        result: localResult
      }]);
    }
    
    // Then with AI scan if Gemini is enabled
    if (geminiOptions.enabled) {
      toast({
        title: "AI Analysis Running",
        description: "Incoming message is being verified...",
        duration: 2000,
      });
      
      // FIX: Don't check the return value of detectScam (which is void)
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
        
        // Analysis complete notification
        toast({
          title: "AI Analysis Complete",
          description: "The message has been verified with AI.",
          duration: 2000,
        });
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
    console.log('Verification for message', messageId, result ? result.riskLevel : 'none');
    return result;
  };

  // Helper function to get message background color based on verification result
  const getMessageBackground = (messageId: string, isMe: boolean) => {
    const verification = getVerificationForMessage(messageId);
    
    if (!verification) return isMe ? 'bg-primary' : 'bg-muted';
    
    switch (verification.riskLevel) {
      case 'scam':
        return isMe 
          ? 'bg-red-600 text-white' 
          : 'bg-red-100 dark:bg-red-900/30 text-foreground';
      case 'suspicious':
        return isMe 
          ? 'bg-amber-500 text-white' 
          : 'bg-amber-100 dark:bg-amber-900/30 text-foreground';
      case 'safe':
      default:
        return isMe 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-green-100 dark:bg-green-900/20 text-foreground';
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto h-[70vh] flex flex-col">
      <CardHeader className="border-b bg-muted/50 py-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Avatar className="h-8 w-8 bg-primary">
            <span className="text-xs">JD</span>
          </Avatar>
          <span>John Doe</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {scamAlerts.map(alert => (
          <ScamAlertBanner 
            key={`alert-${alert.id}`}
            result={alert.result} 
            content={alert.content} 
            onDismiss={() => handleDismissAlert(alert.id)} 
          />
        ))}
        
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
                  {message.sender === 'friend' && (
                    <div className="flex-none absolute -left-6 top-1/2 transform -translate-y-1/2">
                      <MessageVerificationIcon 
                        messageId={message.id}
                        messageContent={message.text}
                        result={getVerificationForMessage(message.id)}
                      />
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words flex-1 pl-1">{message.text}</div>
                  {message.sender === 'me' && (
                    <div className="flex-none absolute -right-6 top-1/2 transform -translate-y-1/2">
                      <MessageVerificationIcon 
                        messageId={message.id}
                        messageContent={message.text}
                        result={getVerificationForMessage(message.id)}
                      />
                    </div>
                  )}
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
