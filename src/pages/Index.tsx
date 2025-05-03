
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
        <main className="container flex-1 py-4 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6">
          <ScamDetectionTabs />
        </main>
        <Footer />
      </div>
    </ScamDetectionProvider>
  );
};

export default Index;
