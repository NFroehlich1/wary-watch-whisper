
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { useScamDetection } from '@/context/ScamDetectionContext';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import MessageInput from './dialog/MessageInput';
import MessagesContainer from './dialog/MessagesContainer';
import { Message, ScamAlert } from './types/ScamDialogTypes';
import { getFirstScenarioMessage, getNextScenarioMessage } from './dialog/ScenarioManager';

interface ScamScenarioDialogProps {
  open: boolean;
  onClose: () => void;
}

const ScamScenarioDialog: React.FC<ScamScenarioDialogProps> = ({ open, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [scamAlerts, setScamAlerts] = useState<ScamAlert[]>([]);
  const [currentScenario, setCurrentScenario] = useState<string>('investment');
  const [messageCount, setMessageCount] = useState(0);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const processingRef = useRef<boolean>(false);
  
  const { detectScam, loading, geminiOptions } = useScamDetection();

  // Function to generate unique message ID
  const generateUniqueId = () => `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Initialize dialog with first message when opened
  useEffect(() => {
    if (open && messages.length === 0 && !processingRef.current) {
      processingRef.current = true;
      
      // Get the first message for the initial scenario
      const firstMessage = getFirstScenarioMessage();
      
      if (firstMessage) {
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
            processingRef.current = false;
          }).catch(() => {
            processingRef.current = false;
          });
        } else {
          processingRef.current = false;
        }
      } else {
        processingRef.current = false;
      }
    }
  }, [open, detectScam, geminiOptions.enabled, messages.length]);

  // Reset dialog when closed
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setScamAlerts([]);
      setMessageCount(0);
      setCurrentScenario('investment');
      processingRef.current = false;
    }
  }, [open]);

  // Handle user sending a message
  const handleSend = (inputMessage: string) => {
    if (inputMessage.trim() && !isGeneratingResponse && !loading && !processingRef.current) {
      setIsGeneratingResponse(true);
      processingRef.current = true;
      
      // Add user message
      const userMessageId = generateUniqueId();
      const userMessage: Message = {
        id: userMessageId,
        sender: 'me',
        text: inputMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Simulate bot response after a short delay
      setTimeout(() => {
        // Get next scenario message based on current scenario and message count
        const nextMessage = getNextScenarioMessage(currentScenario, messageCount, messages);
        
        if (nextMessage) {
          // Update scenario if we've switched to a new one
          if (nextMessage.scenario !== currentScenario) {
            setCurrentScenario(nextMessage.scenario);
          }
          
          const botMessageId = generateUniqueId();
          
          const botMessage: Message = {
            id: botMessageId,
            sender: 'bot',
            text: nextMessage.text,
            timestamp: new Date(),
            scenario: nextMessage.scenario
          };
          
          setMessages(prev => [...prev, botMessage]);
          
          // AI scan the bot message
          if (geminiOptions.enabled) {
            detectScam(nextMessage.text, 'text').then((aiResult) => {
              if (aiResult) {
                setScamAlerts(prev => [...prev, {
                  id: botMessageId,
                  content: nextMessage.text,
                  result: aiResult
                }]);
              }
            }).catch((error) => {
              console.error('Error detecting scam:', error);
            });
          }
        }
        
        setMessageCount(prev => prev + 1);
        setIsGeneratingResponse(false);
        processingRef.current = false;
      }, 1000);
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
          
          <MessagesContainer 
            messages={messages}
            scamAlerts={scamAlerts}
          />
          
          <CardFooter className="border-t p-2">
            <MessageInput
              onSendMessage={handleSend}
              isDisabled={isGeneratingResponse || loading}
            />
          </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default ScamScenarioDialog;
