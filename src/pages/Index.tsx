
import React from 'react';
import Header from '@/components/Header';
import ScamDetectionTabs from '@/components/ScamDetectionTabs';
import Footer from '@/components/Footer';
import { ScamDetectionProvider } from '@/context/ScamDetectionContext';
import { AutoDetectionProvider } from '@/context/AutoDetectionContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ChatDemo from '@/components/chat/ChatDemo';
import { Toaster } from '@/components/ui/toaster';

const Index = () => {
  return (
    <ScamDetectionProvider>
      <AutoDetectionProvider>
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
                    <p className="font-medium">Demo-Chat mit beidseitiger Betrugswarnung</p>
                    <p className="text-muted-foreground mt-1">
                      Senden Sie einige Nachrichten. Der "Freund" wird gelegentlich verdächtige Links oder Texte senden, die automatisch erkannt werden.
                      <span className="font-medium block mt-2">Neues Feature: Auch Ihre eigenen Nachrichten werden überprüft!</span>
                      Versuchen Sie, selbst eine verdächtige Nachricht zu senden (z.B. mit Wörtern wie "Passwort", "Kreditkarte", "dringend" oder URLs).
                    </p>
                    <p className="text-muted-foreground mt-2 border-t border-muted-foreground/20 pt-2">
                      <span className="font-medium text-primary">KI-Analyse aktiviert:</span> Alle Nachrichten werden auch mit KI auf verdächtige Inhalte überprüft.
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
      </AutoDetectionProvider>
    </ScamDetectionProvider>
  );
};

export default Index;
