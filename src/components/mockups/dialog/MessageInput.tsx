
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isDisabled: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isDisabled }) => {
  const [inputMessage, setInputMessage] = useState('');

  const handleSend = () => {
    if (inputMessage.trim() && !isDisabled) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex w-full items-center space-x-2">
      <Input
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type any response to continue the scenario..."
        className="flex-1"
        disabled={isDisabled}
        autoFocus
      />
      <Button 
        onClick={handleSend} 
        size="icon" 
        disabled={!inputMessage.trim() || isDisabled}
      >
        {isDisabled ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default MessageInput;
