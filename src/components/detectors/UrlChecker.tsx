
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScamDetection } from '@/context/ScamDetectionContext';
import ResultDisplay from '../results/ResultDisplay';

const UrlChecker = () => {
  const [url, setUrl] = useState('');
  const { detectScam, loading, result, resetResult } = useScamDetection();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    resetResult();
    await detectScam(url, 'url');
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Check a Website URL</h2>
        <p className="text-muted-foreground">
          Verify if a URL is safe, suspicious, or a known scam before visiting.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-2">
          <Input
            type="url"
            placeholder="Enter URL (e.g., https://example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={loading || !url.trim()}>
            {loading ? 'Checking...' : 'Check URL'}
          </Button>
        </div>
      </form>
      
      {result && <ResultDisplay />}
    </div>
  );
};

export default UrlChecker;
