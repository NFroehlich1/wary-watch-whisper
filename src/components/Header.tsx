
import React from 'react';
import { Shield } from 'lucide-react';

const Header = () => {
  return (
    <header className="py-4 border-b border-gray-200">
      <div className="container flex items-center space-x-2">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ScamShield</h1>
          <p className="text-sm text-muted-foreground">Multilingual Scam Detection for WhatsApp & Websites</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
