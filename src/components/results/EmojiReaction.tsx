
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Smile } from 'lucide-react';
import { RiskLevel } from '@/types';
import { getEmojisByRiskLevel, emojis } from '@/utils/emoji-utils';

interface EmojiReactionProps {
  riskLevel: RiskLevel;
  confidenceLevel?: 'high' | 'medium' | 'low';
}

const EmojiReaction: React.FC<EmojiReactionProps> = ({ riskLevel, confidenceLevel }) => {
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  return (
    <div>
      <h4 className="font-medium text-sm text-muted-foreground mb-1">Add Emoji Reaction:</h4>
      <div className="flex flex-wrap gap-2 mt-1">
        {getEmojisByRiskLevel(riskLevel, confidenceLevel).map((emoji, index) => (
          <Button 
            key={index} 
            variant="outline" 
            className="p-2 h-auto text-lg"
            onClick={() => setSelectedEmoji(emoji)}
          >
            {emoji}
          </Button>
        ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="p-2 h-auto">
              <Smile className="h-5 w-5" /> More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white p-2">
            <div className="grid grid-cols-5 gap-1 p-1">
              {Object.values(emojis).flat().map((emoji, index) => (
                <DropdownMenuItem key={index} className="p-2 cursor-pointer text-lg text-center" onClick={() => setSelectedEmoji(emoji)}>
                  {emoji}
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {selectedEmoji && (
          <Button 
            variant="ghost" 
            className="p-2 h-auto"
            onClick={() => setSelectedEmoji(null)}
          >
            Clear
          </Button>
        )}
      </div>
      {selectedEmoji && (
        <div className="mt-2">
          <span className="text-xl" aria-label="Selected emoji">{selectedEmoji}</span>
        </div>
      )}
    </div>
  );
};

export default EmojiReaction;
