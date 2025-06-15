
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Check } from "lucide-react";
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

interface NewsletterSubscribeModalProps {
  newsletterContent?: string;
}

const NewsletterSubscribeModal = ({ newsletterContent }: NewsletterSubscribeModalProps) => {
  const { t } = useTranslation();
  
  // Form validation schema
  const formSchema = z.object({
    email: z.string().email(t('newsletter.emailValidation'))
  });
  const [open, setOpen] = useState(false);
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
      // Check if email already exists in subscribers table
      const { data: existingSubscriber, error: checkError } = await supabase
        .from('newsletter_subscribers' as any)
        .select('email')
        .eq('email', values.email)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // Error other than "no rows returned"
        console.error("Error checking subscriber:", checkError);
        toast.error(t('newsletter.errorMessage'));
        return;
      }

      if (existingSubscriber) {
        toast.info(t('newsletter.alreadyRegistered'));
        setIsSuccess(true);
      } else {
        // Insert new subscriber
        const { error: insertError } = await supabase
          .from('newsletter_subscribers' as any)
          .insert([{ email: values.email }] as any);

        if (insertError) {
          console.error("Error adding subscriber:", insertError);
          toast.error(t('newsletter.errorMessage'));
          return;
        }

        // Show success message
        setIsSuccess(true);
        toast.success(t('newsletter.successToast'));
      }
      
      // Reset success state after 3 seconds and close dialog
      setTimeout(() => {
        setIsSuccess(false);
        setOpen(false);
        form.reset();
      }, 3000);
    } catch (error) {
      console.error("Fehler beim Abonnieren:", error);
      toast.error(t('newsletter.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Mail className="h-4 w-4" />
{t('newsletter.subscribe')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('newsletter.subscribeTitle')}</DialogTitle>
          <DialogDescription>
{t('newsletter.description')}
          </DialogDescription>
        </DialogHeader>
        
        {isSuccess ? (
          <div className="py-6 text-center">
            <div className="mx-auto rounded-full bg-green-100 p-3 w-fit mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t('newsletter.successTitle')}</h3>
            <p className="text-muted-foreground">
              {t('newsletter.confirmEmail')}
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
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
              
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('newsletter.subscribing') : t('newsletter.subscribe')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewsletterSubscribeModal;
