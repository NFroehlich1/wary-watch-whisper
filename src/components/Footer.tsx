
import React from 'react';
import { ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 py-4 mt-auto">
      <div className="container">
        <p className="text-center text-sm text-muted-foreground mb-2">
          This is a demo of the Multilingual Scam Detection Agent. In a production environment, it would connect to the WhatsApp Cloud API and other security services.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-center text-xs text-muted-foreground gap-2">
          <a 
            href="https://docs.lovable.dev/user-guides/deployment" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Deployment Guide
          </a>
          <span className="hidden md:block">•</span>
          <span>v1.0.0 Beta</span>
          <span className="hidden md:block">•</span>
          <span>© 2025 ScamProtect</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
