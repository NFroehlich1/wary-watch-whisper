
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ContentDisplayProps {
  content: string;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="font-medium text-sm text-muted-foreground">Original Content:</h4>
        <div className="flex items-center text-xs text-amber-600">
          <AlertCircle className="h-3 w-3 mr-1" />
          <span>Analysis is for guidance only and may occasionally flag safe content</span>
        </div>
      </div>
      
      <div className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap max-h-48 overflow-auto border border-muted">
        {content}
      </div>
    </div>
  );
};

export default ContentDisplay;
