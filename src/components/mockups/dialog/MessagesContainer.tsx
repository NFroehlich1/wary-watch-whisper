
import React, { useRef, useEffect } from 'react';
import { Message, ScamAlert } from '../types/ScamDialogTypes';
import MessageBubble from './MessageBubble';

interface MessagesContainerProps {
  messages: Message[];
  scamAlerts: ScamAlert[];
}

const MessagesContainer: React.FC<MessagesContainerProps> = ({ 
  messages,
  scamAlerts
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get verification result for a message
  const getVerificationForMessage = (messageId: string) => {
    return scamAlerts.find(alert => alert.id === messageId)?.result;
  };

  // Check if message is a duplicate of the previous one
  const isDuplicate = (message: Message, index: number) => {
    if (index === 0) return false;
    const previousMessage = messages[index - 1];
    
    return message.text === previousMessage.text && 
           message.sender === previousMessage.sender;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading scenarios...
        </div>
      ) : (
        messages
          // Filter out duplicate messages
          .filter((message, index) => !isDuplicate(message, index))
          .map((message, index) => (
            <MessageBubble
              key={`${message.id}-${index}`}
              id={message.id}
              text={message.text}
              timestamp={message.timestamp}
              sender={message.sender}
              scenario={message.scenario}
              verificationResult={getVerificationForMessage(message.id)}
            />
          ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessagesContainer;
