
import { useState } from "react";
import { toast } from "sonner";
import NewsletterSubscribeCard from "@/components/NewsletterSubscribeCard";
import AdminPanel from "@/components/AdminPanel";
import Header from "@/components/Header";

const Newsletter = () => {
  const [adminMode, setAdminMode] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container max-w-6xl mx-auto py-12 px-4">
        {adminMode ? (
          <AdminPanel onExit={() => setAdminMode(false)} />
        ) : (
          <NewsletterSubscribeCard onAdminLogin={() => setAdminMode(true)} />
        )}
      </main>
    </div>
  );
};

export default Newsletter;
