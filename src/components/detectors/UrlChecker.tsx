
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useScamDetection } from '@/context/ScamDetectionContext';
import ResultDisplay from '../results/ResultDisplay';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const UrlChecker = () => {
  const [url, setUrl] = useState('');
  const [showHttpWarning, setShowHttpWarning] = useState(false);
  const { detectScam, loading, result, resetResult } = useScamDetection();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    resetResult();
    
    // Check if URL uses HTTP instead of HTTPS and show warning
    if (url.toLowerCase().startsWith('http:')) {
      setShowHttpWarning(true);
      // We'll still proceed with the check to get AI analysis
    } else {
      setShowHttpWarning(false);
    }
    
    await detectScam(url, 'url');
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    // Hide the warning when user starts typing again
    if (showHttpWarning) {
      setShowHttpWarning(false);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Check a Website URL</h2>
        <p className="text-muted-foreground">
          Verify if a URL is secure (HTTPS) or using insecure HTTP protocol.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-2">
          <Input
            type="url"
            placeholder="Enter URL (e.g., https://example.com)"
            value={url}
            onChange={handleUrlChange}
            className="flex-1"
            required
          />
          <Button type="submit" disabled={loading || !url.trim()}>
            {loading ? 'Checking...' : 'Check URL'}
          </Button>
        </div>
        
        {showHttpWarning && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Security Warning: This URL uses HTTP instead of HTTPS. HTTP connections are not secure and can be intercepted.
            </AlertDescription>
          </Alert>
        )}
      </form>
      
      {result && <ResultDisplay />}
    </div>
  );
};

export default UrlChecker;
