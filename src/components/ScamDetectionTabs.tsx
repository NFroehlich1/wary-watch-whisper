
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UrlChecker from './detectors/UrlChecker';
import TextChecker from './detectors/TextChecker';
import { useIsMobile } from '@/hooks/use-mobile';

const ScamDetectionTabs = () => {
  const [activeTab, setActiveTab] = useState<string>("url");
  const isMobile = useIsMobile();
  
  return (
    <Tabs defaultValue="url" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
        <TabsTrigger value="url" className="text-xs sm:text-sm">
          {isMobile ? 'URL' : 'URL Checker'}
        </TabsTrigger>
        <TabsTrigger value="text" className="text-xs sm:text-sm">
          {isMobile ? 'Text' : 'Text Analyzer'}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="url" className="py-4 sm:py-6">
        <UrlChecker />
      </TabsContent>
      
      <TabsContent value="text" className="py-4 sm:py-6">
        <TextChecker />
      </TabsContent>
    </Tabs>
  );
};

export default ScamDetectionTabs;
