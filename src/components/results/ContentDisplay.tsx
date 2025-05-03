
import React from 'react';

interface ContentDisplayProps {
  content: string;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content }) => {
  return (
    <div>
      <h4 className="font-medium text-sm text-muted-foreground mb-1">Original Content:</h4>
      <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap max-h-32 overflow-auto">
        {content}
      </p>
    </div>
  );
};

export default ContentDisplay;
