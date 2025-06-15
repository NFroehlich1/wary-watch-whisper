
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewsletterManagement from "@/components/NewsletterManagement";
import NewsletterHistory from "@/components/NewsletterHistory";
import NewsletterArchive from "@/components/NewsletterArchive";
import { useTranslation } from "@/contexts/TranslationContext";

interface AdminPanelProps {
  onExit: () => void;
}

const AdminPanel = ({ onExit }: AdminPanelProps) => {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState<string>("manage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">{t('admin.newsletterManagement')}</h1>
        <Button 
          variant="outline" 
          onClick={onExit}
        >
          {t('admin.backToSubscribe')}
        </Button>
      </div>
      
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="manage">{t('admin.newsletterSend')}</TabsTrigger>
          <TabsTrigger value="archive">{t('admin.newsletterArchive')}</TabsTrigger>
          <TabsTrigger value="history">{t('admin.sendHistory')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manage" className="space-y-6">
          <NewsletterManagement />
        </TabsContent>
        
        <TabsContent value="archive" className="space-y-6">
          <NewsletterArchive />
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <NewsletterHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
