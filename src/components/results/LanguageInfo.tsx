
import React from 'react';
import { Language } from '@/types';

interface LanguageInfoProps {
  detectedLanguage: Language;
}

const LanguageInfo: React.FC<LanguageInfoProps> = ({ detectedLanguage }) => {
  // Helper function to get language name
  const getLanguageName = () => {
    switch (detectedLanguage) {
      case 'en':
        return 'English';
      case 'es':
        return 'Spanish';
      case 'fr':
        return 'French';
      case 'de':
        return 'German';
      default:
        return 'Unknown';
    }
  };

  return (
    <div>
      <h4 className="font-medium text-sm text-muted-foreground mb-1">Detected Language:</h4>
      <p className="text-base">{getLanguageName()}</p>
    </div>
  );
};

export default LanguageInfo;
