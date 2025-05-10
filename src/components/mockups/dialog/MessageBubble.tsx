
import React from 'react';
import { ScamResult } from '@/types';
import MessageVerificationIcon from '../../chat/MessageVerificationIcon';

interface MessageBubbleProps {
  id: string;
  text: string;
  timestamp: Date;
  sender: 'me' | 'bot';
  scenario?: string;
  verificationResult?: ScamResult;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  id,
  text,
  timestamp,
  sender,
  scenario,
  verificationResult
}) => {
  
  // Get message background color based on sender and verification result
  const getMessageBackground = (isMe: boolean) => {
    if (isMe) {
      return 'bg-primary/90 text-primary-foreground';
    }
    
    if (!verificationResult) return 'bg-muted/80';
    
    switch (verificationResult.riskLevel) {
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
    <div className={`flex ${sender === 'me' ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`relative max-w-[75%] px-4 py-2 rounded-lg ${getMessageBackground(sender === 'me')}`}
      >
        <div className="flex items-center gap-2">
          {sender === 'bot' && (
            <div className="flex-none absolute -left-6 top-1/2 transform -translate-y-1/2">
              <MessageVerificationIcon 
                messageId={id}
                messageContent={text}
                result={verificationResult}
              />
            </div>
          )}
          <div className="whitespace-pre-wrap break-words flex-1 pl-1">{text}</div>
        </div>
        <div className={`text-[10px] mt-1 ${
          sender === 'me'
            ? 'text-primary-foreground/70'
            : 'text-muted-foreground'
        }`}>
          {timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          {scenario && <span className="ml-1">({scenario})</span>}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
