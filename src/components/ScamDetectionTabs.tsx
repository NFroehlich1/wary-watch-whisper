
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UrlChecker from './detectors/UrlChecker';
import TextChecker from './detectors/TextChecker';
import VoiceChecker from './detectors/VoiceChecker';
import { useIsMobile } from '@/hooks/use-mobile';

const ScamDetectionTabs = () => {
  const [activeTab, setActiveTab] = useState<string>("url");
  const isMobile = useIsMobile();
  
  return (
    <Tabs defaultValue="url" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
        <TabsTrigger value="url" className="text-xs sm:text-sm">
          {isMobile ? 'URL' : 'URL Checker'}
        </TabsTrigger>
        <TabsTrigger value="text" className="text-xs sm:text-sm">
          {isMobile ? 'Text' : 'Text Analyzer'}
        </TabsTrigger>
        <TabsTrigger value="voice" className="text-xs sm:text-sm">
          {isMobile ? 'Voice' : 'Voice Note Analyzer'}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="url" className="py-4 sm:py-6">
        <UrlChecker />
      </TabsContent>
      
      <TabsContent value="text" className="py-4 sm:py-6">
        <TextChecker />
      </TabsContent>
      
      <TabsContent value="voice" className="py-4 sm:py-6">
        <VoiceChecker />
      </TabsContent>
    </Tabs>
  );
};

export default ScamDetectionTabs;
