
import React from 'react';
import { Shield } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const isMobile = useIsMobile();
  
  return (
    <header className="py-4 border-b border-gray-200">
      <div className="container flex items-center space-x-2">
        <Shield className="h-8 w-8 text-primary flex-shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">ScamProtect</h1>
          <p className={`text-xs sm:text-sm text-muted-foreground ${isMobile ? '' : 'mt-0'}`}>
            {isMobile ? 'Scam Detection' : 'Multilingual Scam Detection for WhatsApp & Websites'}
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
