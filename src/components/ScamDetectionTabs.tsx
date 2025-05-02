
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UrlChecker from './detectors/UrlChecker';
import TextChecker from './detectors/TextChecker';
import VoiceChecker from './detectors/VoiceChecker';

const ScamDetectionTabs = () => {
  const [activeTab, setActiveTab] = useState<string>("url");

  return (
    <Tabs defaultValue="url" className="w-full" onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-3">
        <TabsTrigger value="url">URL Checker</TabsTrigger>
        <TabsTrigger value="text">Text Analyzer</TabsTrigger>
        <TabsTrigger value="voice">Voice Note Analyzer</TabsTrigger>
      </TabsList>
      
      <TabsContent value="url" className="py-6">
        <UrlChecker />
      </TabsContent>
      
      <TabsContent value="text" className="py-6">
        <TextChecker />
      </TabsContent>
      
      <TabsContent value="voice" className="py-6">
        <VoiceChecker />
      </TabsContent>
    </Tabs>
  );
};

export default ScamDetectionTabs;
