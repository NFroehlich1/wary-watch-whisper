
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
                    <div className="mb-4 bg-muted p-3 rounded-md text-sm">
                      <p className="font-medium">Demo chat with bi-directional scam warning</p>
                      <p className="text-muted-foreground mt-1">
                        Send a few messages. The "friend" will occasionally send suspicious links or texts that are automatically detected.
                        <span className="font-medium block mt-2">New feature: Your own messages are also checked!</span>
                        Try sending a suspicious message yourself (e.g., with words like "password", "credit card", "urgent" or URLs).
                      </p>
                      <p className="text-muted-foreground mt-2 border-t border-muted-foreground/20 pt-2">
                        <span className="font-medium text-primary">AI analysis enabled:</span> All messages are also checked for suspicious content with AI.
                      </p>
                      <p className="text-muted-foreground mt-2 border-t border-muted-foreground/20 pt-2">
                        <span className="font-medium text-primary">Security icon:</span> Each message has a verification icon:
                        <span className="inline-flex items-center gap-2 ml-2">
                          <span className="p-1 rounded-full bg-green-50">
                            <span className="text-green-500">✓</span>
                          </span> Safe,
                          <span className="p-1 rounded-full bg-amber-50">
                            <span className="text-amber-500">!</span>
                          </span> Suspicious,
                          <span className="p-1 rounded-full bg-red-50">
                            <span className="text-red-500">✗</span>
                          </span> Scam
                        </span>
                      </p>
                      <p className="text-muted-foreground mt-2 border-t border-muted-foreground/20 pt-2">
                        <span className="font-medium text-primary">Interactive analysis:</span> Click on the shield icons next to each message to see verification details and ask questions about the analysis.
                      </p>
                    </div>
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
