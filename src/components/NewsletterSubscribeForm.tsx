
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, Mail } from "lucide-react";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/contexts/TranslationContext";

const NewsletterSubscribeForm = () => {
  const { t } = useTranslation();
  
  // Form validation schema
  const formSchema = z.object({
    email: z.string().email(t('newsletter.emailValidation'))
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize form with validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Send subscription request to the edge function
      const response = await supabase.functions.invoke("newsletter-send-confirmation", {
        body: { email: values.email }
      });
      
      if (response.error) {
        console.error("Error subscribing:", response.error);
        toast.error(t('newsletter.errorMessage'));
        return;
      }
      
      // Show success message
      setIsSuccess(true);
      toast.success(t('newsletter.successToast'));
      
      // Reset form
      form.reset();
      
      // Reset success state after 5 seconds
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Fehler beim Abonnieren:", error);
      toast.error(t('newsletter.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <>
      {isSuccess ? (
        <div className="py-6 text-center">
          <div className="mx-auto rounded-full bg-green-100 p-3 w-fit mb-4">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">{t('newsletter.successTitle')}</h3>
          <p className="text-muted-foreground">
            {t('newsletter.successDescription')}
          </p>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('newsletter.emailLabel')}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t('newsletter.emailPlaceholder')} 
                      type="email"
                      autoComplete="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    {t('newsletter.emailDescription')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
              
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <Mail className="mr-2 h-4 w-4" />
              {isSubmitting ? t('newsletter.subscribing') : t('newsletter.subscribe')}
            </Button>
          </form>
        </Form>
      )}
    </>
  );
};

export default NewsletterSubscribeForm;
