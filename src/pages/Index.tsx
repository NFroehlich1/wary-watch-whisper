
import React from 'react';
import Header from '@/components/Header';
import ScamDetectionTabs from '@/components/ScamDetectionTabs';
import Footer from '@/components/Footer';
import { ScamDetectionProvider } from '@/context/ScamDetectionContext';
import { AutoDetectionProvider } from '@/context/AutoDetectionContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatDemo from '@/components/chat/ChatDemo';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const Index = () => {
  return (
    <ScamDetectionProvider>
      <AutoDetectionProvider>
        <TooltipProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="container flex-1 py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6">
              <Tabs defaultValue="detector" className="w-full">
                <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
                  <TabsTrigger value="detector">Scam Detector</TabsTrigger>
                  <TabsTrigger value="chat">Chat Demo</TabsTrigger>
                </TabsList>
                <TabsContent value="detector" className="py-4 sm:py-6">
                  <ScamDetectionTabs />
                </TabsContent>
                <TabsContent value="chat" className="py-4 sm:py-6">
                  <div className="max-w-lg mx-auto">
                    <ChatDemo />
                  </div>
                </TabsContent>
              </Tabs>
            </main>
            <Footer />
            <Toaster />
          </div>
        </TooltipProvider>
      </AutoDetectionProvider>
    </ScamDetectionProvider>
  );
};

export default Index;
