
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
  
  const { scanMessage } = useAutoDetection();
  const { detectScam, loading, geminiOptions } = useScamDetection();

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
      
      setMessages([...messages, newMessage]);
      
      // Check if my own message contains suspicious content
      // First with local scan
      const myMessageResult = scanMessage(inputMessage);
      
      // Then with AI scan if Gemini is enabled
      if (geminiOptions.enabled) {
        toast({
          title: "KI-Analyse läuft",
          description: "Ihre Nachricht wird auf verdächtigen Inhalt geprüft...",
          duration: 2000,
        });
        
        detectScam(inputMessage, 'text').then(() => {
          // AI analysis complete
          toast({
            title: "KI-Analyse abgeschlossen",
            description: "Ihre Nachricht wurde überprüft.",
            duration: 2000,
          });
        });
      }
      
      if (myMessageResult) {
        setScamAlerts(prevAlerts => [...prevAlerts, {
          id: newMessage.id,
          content: inputMessage,
          result: myMessageResult
        }]);
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
      responseText = "Hallo! Wie geht's? Schön, dass wir über diesen Chat sprechen können.";
    } else if (randomResponse < 0.2) {
      // 20% chance of sending a suspicious message
      const suspiciousMessages = [
        "Hey, kannst du mir schnell bei etwas helfen? Ich brauche dringend dein Passwort für eine wichtige Sache. Es ist ganz dringend!",
        "Klicke hier, um deinen Gewinn abzuholen: http://suspicious-fake-site.com/claim-prize?user=you",
        "Ich habe eine dringende Nachricht von der Bank bekommen. Du musst sofort hier verifizieren: http://bank-secure-verify.net/urgent",
        "Deine Kreditkarte wurde gesperrt! Verifiziere hier deine Daten: http://verify-bank-account.com",
        "Hey, schau dir dieses tolle Angebot an! Du kannst 5000€ verdienen. Klicke hier: http://get-rich-quick.net/offer"
      ];
      responseText = suspiciousMessages[Math.floor(Math.random() * suspiciousMessages.length)];
      
    } else {
      // Normal responses
      const normalResponses = [
        "Cool, danke für die Info!",
        "Wie war dein Tag?",
        "Hast du schon die Neuigkeiten gehört?",
        "Wollen wir uns am Wochenende treffen?",
        "Ich habe gerade einen tollen Film gesehen.",
        "Kennst du ein gutes Restaurant in der Nähe?"
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
    
    // Then with AI scan if Gemini is enabled
    if (geminiOptions.enabled) {
      toast({
        title: "KI-Analyse läuft",
        description: "Eingehende Nachricht wird überprüft...",
        duration: 2000,
      });
      
      detectScam(responseText, 'text').then(() => {
        // Analysis complete notification
        toast({
          title: "KI-Analyse abgeschlossen",
          description: "Die Nachricht wurde mit KI überprüft.",
          duration: 2000,
        });
      });
    }
    
    if (localResult) {
      setScamAlerts(prevAlerts => [...prevAlerts, {
        id: newMessage.id,
        content: responseText,
        result: localResult
      }]);
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
    return scamAlerts.find(alert => alert.id === messageId)?.result;
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
            Starten Sie eine Konversation...
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] px-4 py-2 rounded-lg ${
                  message.sender === 'me' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-start">
                  {message.sender === 'friend' && (
                    <MessageVerificationIcon 
                      messageId={message.id}
                      messageContent={message.text}
                      result={getVerificationForMessage(message.id)}
                    />
                  )}
                  <div className="whitespace-pre-wrap break-words flex-1">{message.text}</div>
                  {message.sender === 'me' && (
                    <div className="ml-2">
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
            placeholder="Nachricht schreiben..."
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
