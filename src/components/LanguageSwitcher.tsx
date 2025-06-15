import React from 'react';
import { Button } from "@/components/ui/button";
import { Globe } from 'lucide-react';
import { useTranslation, Language } from '@/contexts/TranslationContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();

  const toggleLanguage = () => {
    const newLanguage: Language = language === 'de' ? 'en' : 'de';
    setLanguage(newLanguage);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-2 hover:bg-white/60 hover:backdrop-blur-md hover:shadow-sm hover:border hover:border-white/30 transition-all duration-200"
      title={t('nav.languageSwitch')}
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">
        {language === 'de' ? 'DE' : 'EN'}
      </span>
    </Button>
  );
};

export default LanguageSwitcher; 