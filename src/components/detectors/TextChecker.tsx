
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useScamDetection } from '@/context/ScamDetectionContext';
import { Language } from '@/types';
import ResultDisplay from '../results/ResultDisplay';

const TextChecker = () => {
  const [text, setText] = useState('');
  const { detectScam, loading, result, resetResult } = useScamDetection();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    resetResult();
    await detectScam(text, 'text');
  };
  
  const handleExampleSelect = (exampleType: string) => {
    if (exampleType === 'scam-en') {
      setText('URGENT: Your account has been compromised. Please verify your identity by providing your password and credit card details immediately.');
    } else if (exampleType === 'scam-es') {
      setText('URGENTE: Su cuenta ha sido comprometida. Por favor verifique su identidad proporcionando su contraseña y datos de tarjeta de crédito inmediatamente.');
    } else if (exampleType === 'scam-fr') {
      setText('URGENT: Votre compte a été compromis. Veuillez vérifier votre identité en fournissant votre mot de passe et les détails de votre carte de crédit immédiatement.');
    } else if (exampleType === 'safe') {
      setText('Hi there! Just checking in to see how your day is going. Let me know if you want to grab coffee sometime next week.');
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Analyze Message Text</h2>
        <p className="text-muted-foreground">
          Check if a text message contains scam patterns or suspicious content.
        </p>
      </div>
      
      <div className="flex space-x-2 flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => handleExampleSelect('scam-en')}>
          English Scam Example
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExampleSelect('scam-es')}>
          Spanish Scam Example
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExampleSelect('scam-fr')}>
          French Scam Example
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExampleSelect('safe')}>
          Safe Example
        </Button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <Textarea
            placeholder="Paste the message text here"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="resize-none"
            required
          />
          
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !text.trim()}>
              {loading ? 'Analyzing...' : 'Analyze Text'}
            </Button>
          </div>
        </div>
      </form>
      
      {result && <ResultDisplay />}
    </div>
  );
};

export default TextChecker;
