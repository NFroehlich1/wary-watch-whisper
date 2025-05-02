
import React from 'react';
import Header from '@/components/Header';
import ScamDetectionTabs from '@/components/ScamDetectionTabs';
import Footer from '@/components/Footer';
import { ScamDetectionProvider } from '@/context/ScamDetectionContext';

const Index = () => {
  return (
    <ScamDetectionProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="container flex-1 py-8">
          <ScamDetectionTabs />
        </main>
        <Footer />
      </div>
    </ScamDetectionProvider>
  );
};

export default Index;
