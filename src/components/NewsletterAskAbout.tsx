import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RssItem } from "@/types/newsTypes";
import { MessageSquare, Send, RefreshCw, Bot, User, TrendingUp, Lightbulb, ExternalLink, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from 'react-markdown';
import VoiceInput from './VoiceInput';
import ElevenLabsTTS from './ElevenLabsTTS';

interface NewsletterAskAboutProps {
  articles: RssItem[];
  newsletterContent?: string;
  selectedModel?: 'gemini' | 'mistral';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const NewsletterAskAbout = ({ articles, newsletterContent, selectedModel = 'gemini' }: NewsletterAskAboutProps) => {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [dynamicQuestions, setDynamicQuestions] = useState<string[]>([]);
  const [autoSpeechEnabled, setAutoSpeechEnabled] = useState(false);
  const [lastReadMessageId, setLastReadMessageId] = useState<string | null>(null);

  useEffect(() => {
    generateDynamicQuestions();
  }, [articles, newsletterContent]);

  // Auto-speech effect - reads new assistant messages when auto-speech is enabled
  useEffect(() => {
    if (!autoSpeechEnabled || chatHistory.length === 0) return;

    // Find the latest assistant message
    const latestAssistantMessage = [...chatHistory]
      .reverse()
      .find(msg => msg.role === 'assistant');

    if (latestAssistantMessage && latestAssistantMessage.id !== lastReadMessageId) {
      console.log("🔊 Auto-reading new assistant message:", latestAssistantMessage.id);
      setLastReadMessageId(latestAssistantMessage.id);
      // The ElevenLabsTTS component will handle the actual speech
    }
  }, [chatHistory, autoSpeechEnabled, lastReadMessageId]);

  const generateDynamicQuestions = () => {
    console.log("🔄 Generating new dynamic questions...");
    
    if (articles.length === 0) {
      setDynamicQuestions([
        "Was sind die wichtigsten KI-Trends diese Woche?",
        "Welche neuen Technologien werden diskutiert?",
        "Welche Unternehmen sind besonders aktiv?",
        "Welche Entwicklungen sind für Studierende relevant?"
      ]);
      return;
    }

    const companies = new Set<string>();
    const technologies = new Set<string>();
    const topics = new Set<string>();
    const keyTerms = new Set<string>();

    // Enhanced detection
    articles.forEach(article => {
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      
      // Company detection (expanded)
      ['openai', 'google', 'microsoft', 'meta', 'tesla', 'nvidia', 'apple', 'amazon', 'anthropic', 'midjourney', 'stability ai', 'deepmind', 'xai', 'mistral', 'cohere'].forEach(company => {
        if (text.includes(company.toLowerCase())) companies.add(company);
      });
      
      // Technology detection (expanded)
      ['ki', 'ai', 'artificial intelligence', 'machine learning', 'deep learning', 'llm', 'gpt', 'transformer', 'neural', 'robotik', 'automation', 'chatbot', 'computer vision', 'nlp', 'generative ai', 'agi'].forEach(tech => {
        if (text.includes(tech.toLowerCase())) technologies.add(tech.toUpperCase());
      });
      
      // Topics detection (expanded)
      if (text.includes('startup') || text.includes('funding') || text.includes('investment') || text.includes('finanzierung')) topics.add('Startups & Investitionen');
      if (text.includes('ethik') || text.includes('regulation') || text.includes('gesetz') || text.includes('datenschutz')) topics.add('KI-Ethik & Regulierung');
      if (text.includes('job') || text.includes('karriere') || text.includes('ausbildung') || text.includes('studium')) topics.add('Karriere & Bildung');
      if (text.includes('sicherheit') || text.includes('security') || text.includes('privacy') || text.includes('cyber')) topics.add('Sicherheit');
      if (text.includes('gesundheit') || text.includes('medizin') || text.includes('health') || text.includes('medical')) topics.add('Medizin & Gesundheit');
      if (text.includes('energie') || text.includes('klima') || text.includes('nachhaltigkeit') || text.includes('environment')) topics.add('Umwelt & Energie');
      
      // Extract key terms
      const words = text.split(/\s+/);
      words.forEach(word => {
        if (word.length > 6 && !['artikel', 'unternehmen', 'entwicklung', 'technologie'].includes(word)) {
          keyTerms.add(word);
        }
      });
    });

    // Question templates for variation
    const questionTemplates = {
      company: [
        "Was wird über {company} berichtet?",
        "Welche Entwicklungen zeigt {company}?",
        "Wie positioniert sich {company} im Markt?",
        "Was sind die neuesten Nachrichten zu {company}?",
        "Welche Strategie verfolgt {company}?"
      ],
      comparison: [
        "Wie unterscheiden sich die Ansätze von {comp1} und {comp2}?",
        "Was sind die Gemeinsamkeiten zwischen {comp1} und {comp2}?",
        "Wer ist führend: {comp1} oder {comp2}?",
        "Welche Konkurrenz besteht zwischen {comp1} und {comp2}?"
      ],
      technology: [
        "Welche Entwicklungen gibt es bei {tech}?",
        "Wie wird {tech} eingesetzt?",
        "Was sind die Vorteile von {tech}?",
        "Welche Herausforderungen gibt es bei {tech}?",
        "Wie verändert {tech} die Branche?"
      ],
      topic: [
        "Was wird zu {topic} berichtet?",
        "Welche Trends zeigen sich bei {topic}?",
        "Wie entwickelt sich {topic}?",
        "Welche Auswirkungen hat {topic}?",
        "Was sollte man über {topic} wissen?"
      ],
      general: [
        "Was sind die wichtigsten Erkenntnisse aus den Artikeln?",
        "Welche praktischen Tipps kann ich ableiten?",
        "Welche Trends lassen sich erkennen?",
        "Was ist besonders relevant für Studierende?",
        "Welche Artikel sind am interessantesten?",
        "Fasse die wichtigsten Punkte zusammen",
        "Welche Entwicklungen sind überraschend?",
        "Was sollte ich als Nächstes lesen?",
        "Welche langfristigen Auswirkungen sind zu erwarten?",
        "Wie beeinflussen diese Entwicklungen den Arbeitsmarkt?",
        "Welche Geschäftsmodelle entstehen?",
        "Was bedeuten diese Trends für die Zukunft?"
      ],
      newsletter: [
        "Was sind die Kernaussagen dieses Newsletters?",
        "Welche Artikel werden besonders hervorgehoben?",
        "Wie hängen die verschiedenen Artikel zusammen?",
        "Was ist das übergreifende Thema?",
        "Welche Schlüsselerkenntnisse vermittelt der Newsletter?"
      ]
    };

    let questions: string[] = [];

    // Add newsletter-specific questions if content is available
    if (newsletterContent) {
      const newsletterQuestions = questionTemplates.newsletter;
      questions.push(newsletterQuestions[Math.floor(Math.random() * newsletterQuestions.length)]);
    }

    // Add company-specific questions
    const companyArray = Array.from(companies);
    if (companyArray.length > 0) {
      const randomCompany = companyArray[Math.floor(Math.random() * companyArray.length)];
      const template = questionTemplates.company[Math.floor(Math.random() * questionTemplates.company.length)];
      questions.push(template.replace('{company}', randomCompany));

      // Add comparison question if multiple companies
      if (companyArray.length > 1) {
        const shuffled = [...companyArray].sort(() => 0.5 - Math.random());
        const template = questionTemplates.comparison[Math.floor(Math.random() * questionTemplates.comparison.length)];
        questions.push(template.replace('{comp1}', shuffled[0]).replace('{comp2}', shuffled[1]));
      }
    }

    // Add technology questions
    const techArray = Array.from(technologies);
    if (techArray.length > 0) {
      const randomTech = techArray[Math.floor(Math.random() * techArray.length)];
      const template = questionTemplates.technology[Math.floor(Math.random() * questionTemplates.technology.length)];
      questions.push(template.replace('{tech}', randomTech));
    }

    // Add topic questions
    const topicArray = Array.from(topics);
    if (topicArray.length > 0) {
      const randomTopic = topicArray[Math.floor(Math.random() * topicArray.length)];
      const template = questionTemplates.topic[Math.floor(Math.random() * questionTemplates.topic.length)];
      questions.push(template.replace('{topic}', randomTopic));
    }

    // Always add some general questions (randomly selected)
    const generalQuestions = [...questionTemplates.general].sort(() => 0.5 - Math.random()).slice(0, 3);
    questions.push(...generalQuestions);

    // Shuffle and limit to 6 questions
    const finalQuestions = questions.sort(() => 0.5 - Math.random()).slice(0, 6);

    console.log("✨ Generated dynamic questions:", finalQuestions);
    console.log("🏢 Detected companies:", Array.from(companies));
    console.log("🔬 Detected technologies:", Array.from(technologies));
    console.log("📊 Detected topics:", Array.from(topics));
    
    setDynamicQuestions(finalQuestions);
    toast.success("Neue Fragevorschläge generiert!");
  };

  const getWeekNumber = (date: Date): number => {
    const startDate = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil(days / 7);
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast.error("Bitte geben Sie eine Frage ein");
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      console.log("Asking question about newsletter articles:", question);
      console.log("Using AI provider:", selectedModel);
      console.log("Articles available:", articles.length);
      console.log("Newsletter content available:", !!newsletterContent);
      
      // Prepare context from articles and newsletter
      const articlesContext = articles.map(article => ({
        title: article.title,
        description: article.description || '',
        sourceName: article.sourceName,
        pubDate: article.pubDate,
        link: article.link,
        content: article.content || article.description || ''
      }));

      console.log("Prepared articles context:", articlesContext.length);

      // Create enhanced prompt that includes newsletter content
      let contextualPrompt = `Beantworte die folgende Frage basierend auf dem kompletten Newsletter-Inhalt und den zugehörigen Artikeln: "${question}"\n\n`;
      
      if (newsletterContent) {
        contextualPrompt += `NEWSLETTER-INHALT:\n${newsletterContent}\n\n`;
        contextualPrompt += `Zusätzlich sind hier die ursprünglichen Artikel, auf denen der Newsletter basiert:\n\n`;
      } else {
        contextualPrompt += `Basiere deine Antwort auf den folgenden Artikeln:\n\n`;
      }
      
      contextualPrompt += `ARTIKEL-DETAILS:\n`;
      articlesContext.forEach((article, index) => {
        contextualPrompt += `Artikel ${index + 1}: ${article.title}\n`;
        contextualPrompt += `   Quelle: ${article.sourceName}\n`;
        contextualPrompt += `   Link: ${article.link}\n`;
        contextualPrompt += `   Beschreibung: ${article.description}\n`;
        if (article.content && article.content !== article.description) {
          contextualPrompt += `   Inhalt: ${article.content.substring(0, 300)}...\n`;
        }
        contextualPrompt += `\n`;
      });
      
      contextualPrompt += `\nGib eine detaillierte, hilfreiche Antwort auf Deutsch. ${newsletterContent ? 'Beziehe dich sowohl auf den Newsletter-Inhalt als auch auf die ursprünglichen Artikel.' : 'Beziehe dich konkret auf die relevanten Artikel und deren Inhalte.'} 

WICHTIG: Wenn du auf spezifische Artikel verweist, verwende IMMER das Format "Artikel X" (z.B. "Artikel 1", "Artikel 2"), damit diese automatisch zu klickbaren Links werden. Beispiel: "Wie in Artikel 3 beschrieben..." oder "Artikel 1 und Artikel 5 zeigen...".

Nenne spezifische Artikel oder Abschnitte aus dem Newsletter als Quelle.`;

      // Use qa-with-newsletter action for proper Q&A functionality
      const functionName = selectedModel === 'gemini' ? 'gemini-ai' : 'mistral-ai';
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          action: 'qa-with-newsletter',
          data: { 
            question: question,
            newsletter: newsletterContent || contextualPrompt
          }
        }
      });

      console.log("Supabase function response:", { data, error });

      if (error) {
        console.error("Supabase function error:", error);
        toast.error("Fehler bei der Verbindung zum KI-Service");
        return;
      }

      if (data?.error) {
        console.error(`${selectedModel} API Error:`, data.error);
        toast.error("Fehler beim Generieren der Antwort: " + data.error);
        return;
      }

      let answer = '';
      if (data?.content) {
        answer = data.content;
      } else if (data?.answer) {
        answer = data.answer;
      } else {
        console.error("No content in response:", data);
        toast.error("Keine Antwort erhalten");
        return;
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, assistantMessage]);
      console.log("Question answered successfully");

    } catch (error) {
      console.error("Error asking question:", error);
      toast.error("Fehler beim Stellen der Frage: " + (error as Error).message);
    } finally {
      setIsLoading(false);
      setQuestion("");
    }
  };

  const clearChat = () => {
    setChatHistory([]);
    toast.success("Chat-Verlauf gelöscht");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  // Add voice input handler
  const handleVoiceTranscript = (transcript: string) => {
    console.log("🎤 Voice transcript received:", transcript);
    
    // Append to existing question or set as new question
    if (question.trim()) {
      setQuestion(prev => prev + " " + transcript);
      toast.success("Spracheingabe hinzugefügt!");
    } else {
      setQuestion(transcript);
      toast.success("Frage per Sprache erfasst!");
    }
  };

  // Toggle auto-speech functionality
  const toggleAutoSpeech = () => {
    const newState = !autoSpeechEnabled;
    setAutoSpeechEnabled(newState);
    
    if (newState) {
      // When enabling, read the latest assistant message if available
      const latestAssistantMessage = [...chatHistory]
        .reverse()
        .find(msg => msg.role === 'assistant');
      
      if (latestAssistantMessage) {
        setLastReadMessageId(latestAssistantMessage.id);
        toast.success("Automatische Sprachausgabe aktiviert! Letzte Antwort wird vorgelesen.");
      } else {
        toast.success("Automatische Sprachausgabe aktiviert!");
      }
    } else {
      setLastReadMessageId(null);
      toast.success("Automatische Sprachausgabe deaktiviert");
    }
  };

  // Function to convert article references to clickable links
  const processArticleLinks = (content: string): string => {
    // Pattern to match article references like "Artikel 1", "Artikel 2", etc.
    const articlePattern = /\b(?:Artikel|Article)\s+(\d+)\b/gi;
    
    return content.replace(articlePattern, (match, articleNumber) => {
      const index = parseInt(articleNumber) - 1; // Convert to 0-based index
      
      if (index >= 0 && index < articles.length) {
        const article = articles[index];
        // Create markdown link with article title and URL
        return `[${match}: "${article.title}"](${article.link})`;
      }
      
      return match; // Return original if article not found
    });
  };

  // Custom ReactMarkdown component with enhanced link handling
  const MarkdownWithLinks = ({ content }: { content: string }) => {
    const processedContent = processArticleLinks(content);
    
    return (
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 text-gray-700">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
          li: ({ children }) => <li className="text-gray-700">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline decoration-blue-600/30 hover:decoration-blue-800 transition-colors"
              title={`Öffne ${href} in neuem Tab`}
              {...props}
            >
              {children}
              <ExternalLink className="h-3 w-3" />
            </a>
          )
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  return (
    <Card className="mt-6 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/80">
      <CardHeader className="border-b bg-white/70 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                Fragen zum Newsletter
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Stellen Sie Fragen zu den {articles.length} Artikeln {newsletterContent ? 'und dem Newsletter-Inhalt' : 'in diesem Newsletter'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Auto-Speech Toggle Button */}
            <Button 
              variant={autoSpeechEnabled ? "default" : "outline"} 
              size="sm" 
              onClick={toggleAutoSpeech}
              className={autoSpeechEnabled ? "bg-green-600 hover:bg-green-700" : ""}
              title={autoSpeechEnabled ? "Automatische Sprachausgabe deaktivieren" : "Automatische Sprachausgabe aktivieren"}
            >
              {autoSpeechEnabled ? (
                <>
                  <Volume2 className="h-4 w-4 mr-1" />
                  Auto-TTS AN
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4 mr-1" />
                  Auto-TTS AUS
                </>
              )}
            </Button>
            {chatHistory.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearChat}>
                Chat löschen
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50/50">
            {chatHistory.map((message) => (
              <div 
                key={message.id} 
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>
                  <div className={`rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-white' 
                      : 'bg-white border border-gray-200'
                  }`}>
                    {message.role === 'assistant' ? (
                      <div className="space-y-2">
                        <div className="prose prose-sm max-w-none">
                          <MarkdownWithLinks content={message.content} />
                        </div>
                        {/* TTS Controls for Assistant Messages */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <div className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* TTS Button with Auto-play */}
                            <ElevenLabsTTS 
                              text={message.content}
                              className="text-xs"
                              isDisabled={isLoading}
                              autoPlay={autoSpeechEnabled && message.id === lastReadMessageId}
                              onAutoPlayComplete={() => {
                                console.log(`✅ Auto-play completed for message: ${message.id}`);
                              }}
                            />
                            {/* Auto-TTS Indicator */}
                            {autoSpeechEnabled && message.id === lastReadMessageId && (
                              <div className="text-xs text-green-600 flex items-center gap-1">
                                <Volume2 className="h-3 w-3" />
                                Auto
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm">{message.content}</p>
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Question Input with Voice Support */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="text-xs">
              {articles.length} Artikel verfügbar
            </Badge>
            {newsletterContent && (
              <Badge variant="outline" className="text-xs">
                Newsletter-Inhalt verfügbar
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium text-gray-700">
              Ihre Frage:
            </label>
            <Textarea
              id="question"
              placeholder={newsletterContent 
                ? "Z.B. 'Welche KI-Trends werden im Newsletter diskutiert?' oder nutzen Sie die Spracheingabe..."
                : "Z.B. 'Welche KI-Trends werden in den Artikeln diskutiert?' oder nutzen Sie die Spracheingabe..."
              }
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleAskQuestion} 
              disabled={isLoading || !question.trim()}
              className="flex-1 gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isLoading ? "Analysiere..." : "Frage stellen"}
            </Button>
            
            {/* Voice Input Button */}
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              isDisabled={isLoading}
              language="de-DE"
            />
          </div>
        </div>

        {/* Suggested Questions */}
        {chatHistory.length === 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">
                Intelligente Fragevorschläge:
              </p>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={generateDynamicQuestions}
                className="h-6 px-2 text-xs ml-auto"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {dynamicQuestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="text-left text-xs p-2 h-auto whitespace-normal justify-start hover:bg-blue-50 border border-transparent hover:border-blue-200"
                  onClick={() => setQuestion(suggestion)}
                  disabled={isLoading}
                >
                  <Lightbulb className="h-3 w-3 mr-1 flex-shrink-0 text-blue-500" />
                  "{suggestion}"
                </Button>
              ))}
            </div>

            {/* Article context info */}
            {articles.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-blue-700 mb-2">
                  📊 Basierend auf {articles.length} Artikeln {newsletterContent ? 'und Newsletter-Inhalt' : 'dieses Newsletters'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {articles.slice(0, 3).map((article, index) => (
                    <span key={index} className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                      {article.title.substring(0, 25)}...
                    </span>
                  ))}
                  {articles.length > 3 && (
                    <span className="text-xs text-blue-600">
                      +{articles.length - 3} weitere
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsletterAskAbout;
