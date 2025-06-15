import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'de' | 'en';

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'de';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || translations['de'][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

// Translation dictionary
const translations = {
  de: {
    // Navigation
    'nav.home': 'Home',
    'nav.newsletter': 'Newsletter',
    'nav.database': 'KI-Datenbank',
    'nav.rss': 'RSS Verwaltung',
    'nav.studentNews': 'Student News',
    'nav.archiveQA': 'Archiv Q&A',
    'nav.languageSwitch': 'Sprache',
    
    // Header
    'header.title': 'LINKIT NEWS',
    
    // Index page
    'index.title': 'KI News Digest',
    'index.subtitle': 'Automatische KI- und Data Science News Aggregation mit intelligenter Filterung für relevante Newsletter-Inhalte',
    'index.refreshArticles': 'Artikel aktualisieren',
    'index.addCustomArticle': 'Eigenen Artikel hinzufügen',
    'index.generateDigest': 'Digest erstellen',
    'index.testGemini': 'Gemini API testen',
    'index.testElevenLabs': 'Eleven Labs testen',
    'index.testRss': 'RSS-Test durchführen',
    'index.weeklyDigest': 'Wöchentliche Zusammenfassung',
    'index.noArticles': 'Keine Artikel für diese Woche gefunden',
    'index.loadingArticles': 'Lade Artikel...',
    'index.customSource': 'Eigener',
    'index.improvingTitle': 'Verbessere Titel...',
    'index.generateSummary': 'Zusammenfassung erstellen',
    'index.generatingSummary': 'Erstelle Zusammenfassung...',
    'index.improveTitle': 'Titel verbessern',
    'index.top10Students': 'Top 10 für Studenten anzeigen',
    'index.searchDatabase': 'KI-News Datenbank durchsuchen',
    'index.rssDebugTest': 'RSS Debug Test',
    'index.geminiApiTest': 'Gemini API Test',
    'index.elevenLabsTest': 'Eleven Labs Test',
    'index.testing': 'Teste...',
    'index.selectModel': 'LLM-Model auswählen',
    'index.testApiModel': 'API testen',
    'index.testingModel': 'Teste API...',
    'index.noNewsFound': 'Keine Nachrichten für diese Woche gefunden',
    'index.tryAgain': 'Erneut versuchen',
    'index.addArticle': 'Artikel hinzufügen',
    'index.customArticlesCount': 'eigene Artikel in der Übersicht',
    'index.noCustomArticles': 'Noch keine eigenen Artikel',
    'index.clickPlusToAdd': 'Klicken Sie auf das + um Artikel hinzuzufügen',
    'index.customArticleLabel': 'Eigener Artikel',
    'index.customArticleDescription': 'Ihre eigenen Artikel werden direkt in der Hauptübersicht mit einem',
    'index.customArticleDescription2': 'Label angezeigt.',
    'index.articlesAdded': 'Artikel hinzugefügt',
    'index.duplicateArticle': '⚠️ Ein Artikel mit dieser URL ist bereits in der lokalen Liste vorhanden',
    'index.articleAdded': '✅ Artikel erfolgreich hinzugefügt und gespeichert',
    'index.errorSavingArticle': '❌ Fehler beim Speichern des Artikels in der Datenbank',
    'index.errorImprovingTitle': 'Fehler bei der Titel-Verbesserung',
    'index.noImprovedTitle': 'Kein verbesserter Titel erhalten',
    
    // Toast messages
    'toast.testingGemini': 'Teste Gemini API...',
    'toast.testingMistral': 'Teste Mistral API...',
    'toast.geminiSuccess': '✅ Gemini API funktioniert:',
    'toast.mistralSuccess': '✅ Mistral API funktioniert:',
    'toast.geminiError': '❌ Gemini API Problem:',
    'toast.mistralError': '❌ Mistral API Problem:',
    'toast.geminiTestError': 'Gemini Test Fehler:',
    'toast.mistralTestError': 'Mistral Test Fehler:',
    'toast.testingElevenLabs': 'Teste Eleven Labs API...',
    'toast.elevenLabsSuccess': '✅ Eleven Labs API funktioniert:',
    'toast.elevenLabsError': '❌ Eleven Labs API Problem:',
    'toast.elevenLabsTestError': 'Eleven Labs Test Fehler:',
    'toast.testingRss': 'Teste RSS-Loading...',
    'toast.rssSuccess': '✅ neue Artikel gefunden!',
    'toast.rssNoArticles': 'Keine neuen Artikel gefunden',
    'toast.rssError': 'RSS-Test Fehler:',
    'toast.edgeFunctionError': 'Edge Function Fehler:',
    'toast.relayError': 'Relay Fehler:',
    'toast.networkError': 'Netzwerk Fehler:',
    'toast.unknownError': 'Unbekannter Fehler:',
    'toast.digestCreating': 'Erstelle Digest...',
    'toast.digestSuccess': 'Digest erfolgreich erstellt!',
    'toast.digestError': 'Fehler beim Erstellen des Digests:',
    'toast.titleImproving': 'Verbessere Titel...',
    'toast.titleImproved': 'Titel erfolgreich verbessert!',
    'toast.titleError': 'Fehler beim Verbessern des Titels:',
    'toast.summaryGenerating': 'Erstelle Zusammenfassung...',
    'toast.summaryGenerated': 'Zusammenfassung erstellt!',
    'toast.summaryError': 'Fehler beim Erstellen der Zusammenfassung:',
    'toast.student_news_error': 'Fehler beim Laden der Studenten-relevanten Nachrichten:',
    
    // Error messages
    'error.functionError': 'Supabase function error:',
    'error.httpError': 'HTTP',
    'error.unknownStatus': 'unknown status',
    'error.couldNotParse': 'Could not parse error response:',
    
    // Newsletter components
    'newsletter.subscribe': 'Newsletter abonnieren',
    'newsletter.subscribing': 'Wird abonniert...',
    'newsletter.subscribeTitle': 'KI-Newsletter abonnieren',
    'newsletter.emailValidation': 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    'newsletter.emailLabel': 'E-Mail-Adresse',
    'newsletter.emailPlaceholder': 'ihre.email@example.com',
    'newsletter.emailDescription': 'Wir verwenden Ihre E-Mail-Adresse nur für den Versand des Newsletters.',
    'newsletter.successTitle': 'Anmeldung erfolgreich!',
    'newsletter.successDescription': 'Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link, den wir Ihnen gesendet haben.',
    'newsletter.errorMessage': 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.',
    'newsletter.successToast': 'Vielen Dank für Ihr Interesse! Sie erhalten bald eine Bestätigungs-E-Mail.',
    'newsletter.description': 'Erhalten Sie jeden Dienstagmorgen die wichtigsten KI-Nachrichten direkt in Ihrem Postfach.',
    'newsletter.alreadyRegistered': 'Diese E-Mail ist bereits registriert. Vielen Dank für Ihr Interesse!',
    'newsletter.confirmEmail': 'Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link, den wir Ihnen gesendet haben.',
    'newsletter.weeklyFrequency': 'Wir versenden unseren Newsletter einmal pro Woche.',
    'newsletter.unsubscribeAnytime': 'Sie können sich jederzeit vom Newsletter abmelden.',
    'newsletter.adminAccess': 'Administrator-Zugang',

    // Admin Panel
    'admin.newsletterManagement': 'Newsletter-Verwaltung',
    'admin.backToSubscribe': 'Zurück zum Abonnieren',
    'admin.newsletterSend': 'Newsletter-Versand',
    'admin.newsletterArchive': 'Newsletter-Archiv',
    'admin.sendHistory': 'Versand-Historie',
    'admin.manageSettings': 'Verwalten Sie Ihre Newsletter-Einstellungen und versenden Sie Newsletter aus dem Archiv.',
    'admin.basicSettings': 'Grundeinstellungen',
    'admin.newsletterSelection': 'Newsletter-Auswahl',
    'admin.preview': 'Vorschau',
    'admin.subscribers': 'Abonnenten',
    'admin.clickLoad': 'Klicken Sie auf \'Laden\'',
    'admin.load': 'Laden',
    'admin.loading': 'Lädt...',
    'admin.sendTime': 'Versandzeitpunkt',
    'admin.senderName': 'Absender-Name',
    'admin.senderEmail': 'Absender-E-Mail',
    'admin.sendNewsletterNow': 'Newsletter jetzt senden',
    'admin.confirmedSubscribers': 'bestätigte Abonnenten',
    'admin.newsletterSubject': 'Newsletter-Betreff',
    'admin.selectFromArchive': 'Newsletter aus Archiv auswählen',
    'admin.loadingArchive': 'Lade Archiv...',
    'admin.selectNewsletter': 'Newsletter auswählen',
    'admin.selectedContent': 'Ausgewählter Newsletter-Inhalt',
    'admin.contentPlaceholder': 'Newsletter-Inhalt wird hier angezeigt...',
    'admin.generatePreview': 'Vorschau generieren',
    'admin.from': 'Von:',
    'admin.subscribeReceived': 'Sie erhalten diesen Newsletter, weil Sie sich dafür angemeldet haben.',
    'admin.unsubscribeHere': 'Hier abmelden',
    'admin.selectNewsletterAndGenerate': 'Bitte wählen Sie einen Newsletter aus und klicken Sie auf \'Vorschau generieren\'.',
    'admin.sendingNewsletter': 'Newsletter wird gesendet...',

    // Weekly Digest components
    'weeklyDigest.editTop10': 'Top 10 bearbeiten',
    'weeklyDigest.editArticles': 'Artikel bearbeiten',
    'weeklyDigest.saveToArchive': 'Im Archiv speichern',
    'weeklyDigest.saving': 'Speichert...',
    'weeklyDigest.saved': 'Gespeichert',

    // News Card components
    'newsCard.readArticle': 'Artikel lesen',
    'newsCard.aiSummary': 'KI-Zusammenfassung',
    'newsCard.generatingSummary': 'KI-Zusammenfassung wird generiert...',
    'newsCard.generateSummary': 'KI-Zusammenfassung basierend auf echtem Artikel',
    'newsCard.summaryError': 'Fehler bei der Generierung der Zusammenfassung',
    'newsCard.summaryGenerated': 'KI-Zusammenfassung basierend auf echtem Artikel generiert',
    'newsCard.noSummaryReceived': 'Keine Zusammenfassung erhalten',

    // UI Elements
    'ui.showMore': 'Mehr anzeigen',
    'ui.showLess': 'Weniger anzeigen',
    'ui.allArticles': 'Alle Artikel',
    'ui.top10': 'Top 10',
    'ui.news': 'Nachrichten',
    'ui.newsletter': 'Newsletter',
    'ui.questions': 'Fragen',
    'ui.qa': 'Q&A',
    'ui.autoNewsletter': 'Auto-Newsletter',
    'ui.createNewsletter': 'Newsletter erstellen',
    'ui.regenerate': 'Neu generieren',
    'ui.generating': 'Generiert...',
    'ui.generatingAuto': 'Generiert automatisch...',
    'ui.topRelevantArticles': 'relevanteste Artikel (automatisch ausgewählt)',
    'ui.selectedArticles': 'ausgewählte Artikel für Newsletter',
    'ui.selected': 'ausgewählt',
    'ui.analysisRealContent': 'Analysiere echte Artikel-Inhalte...',
    'ui.analysisRealContentShort': 'Analysiere echte Inhalte...',
    'ui.noArticlesFound': 'Keine Artikel gefunden',
    'ui.tryReloadNews': 'Versuchen Sie, die Nachrichten neu zu laden',
    'ui.articlesLoading': 'Artikel werden geladen...',

    // Database page
    'database.title': 'KI-News Datenbank',
    'database.subtitle': 'Durchsuche und entdecke KI-News sortiert nach thematischen Clustern und Relevanz',
    'database.searchPlaceholder': 'Suche nach Artikeln...',
    'database.selectCluster': 'Cluster auswählen',
    'database.allClusters': 'Alle Cluster',
    'database.sortByRelevance': 'Nach Relevanz',
    'database.sortByClusterRelevance': 'Nach Cluster-Relevanz',
    'database.sortByDate': 'Nach Datum',
    'database.descending': 'Absteigend',
    'database.ascending': 'Aufsteigend',
    'database.cards': 'Karten',
    'database.list': 'Liste',
    'database.all': 'Alle',
    'database.noArticlesAvailable': 'Noch keine Artikel verfügbar',
    'database.loadArticlesFirst': 'Lade zuerst einige Artikel über die Hauptseite oder verwende den RSS Debug Test.',
    'database.loadArticles': 'Artikel laden',
    'database.toMainPage': 'Zur Hauptseite',
    'database.errorLoading': 'Fehler beim Laden',
    'database.tryAgain': 'Erneut versuchen',
    'database.noArticlesFoundError': 'Keine Artikel gefunden. Versuche die Seite neu zu laden.',
    'database.articlesLoadedAndClassified': 'Artikel geladen und nach Relevanz klassifiziert',
    'database.errorLoadingArticles': 'Fehler beim Laden der Artikel',
    'database.articlesOf': 'von',
    'database.articles': 'Artikeln',
    'database.noArticlesFoundInFilter': 'Keine Artikel gefunden',
    'database.tryDifferentSearch': 'Versuche eine andere Suche oder entferne Filter',
    'database.reloadToLoad': 'Lade die Seite neu, um Artikel zu laden',
    'database.reloadArticles': 'Artikel neu laden',

    // AI Clusters
    'clusters.modellentwicklung': 'Modellentwicklung',
    'clusters.governanceEthik': 'Governance & Ethik',
    'clusters.educationLearning': 'Education & Learning',
    'clusters.useCases': 'Use Cases',
    'clusters.geopolitischeDynamiken': 'Geopolitische Dynamiken',
    'clusters.wirtschaftMarkt': 'Wirtschaft & Markt',
    
    // Cluster Descriptions
    'clusters.modellentwicklungDesc': 'Fortschritte in der KI-Modellentwicklung und -architektur',
    'clusters.governanceEthikDesc': 'Ethische Herausforderungen und regulatorische Entwicklungen',
    'clusters.educationLearningDesc': 'KI in der Bildung und Lernprozessen',
    'clusters.useCasesDesc': 'Praktische Anwendungen von KI in verschiedenen Branchen',
    'clusters.geopolitischeDynamikenDesc': 'Internationale KI-Politik und geopolitische Spannungen',
    'clusters.wirtschaftMarktDesc': 'Marktentwicklungen und wirtschaftliche Aspekte der KI',

    // General
    'general.loading': 'Laden...',
    'general.error': 'Fehler',
    'general.success': 'Erfolg',
    'general.cancel': 'Abbrechen',
    'general.save': 'Speichern',
    'general.delete': 'Löschen',
    'general.edit': 'Bearbeiten',
    'general.create': 'Erstellen',
    'general.week': 'KW',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.newsletter': 'Newsletter',
    'nav.database': 'AI Database',
    'nav.rss': 'RSS Management',
    'nav.studentNews': 'Student News',
    'nav.archiveQA': 'Archive Q&A',
    'nav.languageSwitch': 'Language',
    
    // Header
    'header.title': 'LINKIT NEWS',
    
    // Index page
    'index.title': 'AI News Digest',
    'index.subtitle': 'Automatic AI & Data Science News Aggregation with intelligent filtering for relevant newsletter content',
    'index.refreshArticles': 'Refresh Articles',
    'index.addCustomArticle': 'Add Custom Article',
    'index.generateDigest': 'Generate Digest',
    'index.testGemini': 'Test Gemini API',
    'index.testElevenLabs': 'Test Eleven Labs',
    'index.testRss': 'Perform RSS Test',
    'index.weeklyDigest': 'Weekly Summary',
    'index.noArticles': 'No articles found for this week',
    'index.loadingArticles': 'Loading articles...',
    'index.customSource': 'Custom',
    'index.improvingTitle': 'Improving title...',
    'index.generateSummary': 'Generate Summary',
    'index.generatingSummary': 'Generating summary...',
    'index.improveTitle': 'Improve Title',
    'index.top10Students': 'Show Top 10 for Students',
    'index.searchDatabase': 'Search AI News Database',
    'index.rssDebugTest': 'RSS Debug Test',
    'index.geminiApiTest': 'Gemini API Test',
    'index.elevenLabsTest': 'Eleven Labs Test',
    'index.testing': 'Testing...',
    'index.selectModel': 'Select LLM Model',
    'index.testApiModel': 'Test API',
    'index.testingModel': 'Testing API...',
    'index.noNewsFound': 'No news found for this week',
    'index.tryAgain': 'Try Again',
    'index.addArticle': 'Add Article',
    'index.customArticlesCount': 'custom articles in overview',
    'index.noCustomArticles': 'No custom articles yet',
    'index.clickPlusToAdd': 'Click + to add articles',
    'index.customArticleLabel': 'Custom Article',
    'index.customArticleDescription': 'Your custom articles are displayed directly in the main overview with a',
    'index.customArticleDescription2': 'label.',
    'index.articlesAdded': 'articles added',
    'index.duplicateArticle': '⚠️ An article with this URL is already in the local list',
    'index.articleAdded': '✅ Article successfully added and saved',
    'index.errorSavingArticle': '❌ Error saving article to database',
    'index.errorImprovingTitle': 'Error improving title',
    'index.noImprovedTitle': 'No improved title received',
    
    // Toast messages
    'toast.testingGemini': 'Testing Gemini API...',
    'toast.testingMistral': 'Testing Mistral API...',
    'toast.geminiSuccess': '✅ Gemini API works:',
    'toast.mistralSuccess': '✅ Mistral API works:',
    'toast.geminiError': '❌ Gemini API problem:',
    'toast.mistralError': '❌ Mistral API problem:',
    'toast.geminiTestError': 'Gemini test error:',
    'toast.mistralTestError': 'Mistral test error:',
    'toast.testingElevenLabs': 'Testing Eleven Labs API...',
    'toast.elevenLabsSuccess': '✅ Eleven Labs API works:',
    'toast.elevenLabsError': '❌ Eleven Labs API problem:',
    'toast.elevenLabsTestError': 'Eleven Labs test error:',
    'toast.testingRss': 'Testing RSS loading...',
    'toast.rssSuccess': '✅ new articles found!',
    'toast.rssNoArticles': 'No new articles found',
    'toast.rssError': 'RSS test error:',
    'toast.edgeFunctionError': 'Edge Function error:',
    'toast.relayError': 'Relay error:',
    'toast.networkError': 'Network error:',
    'toast.unknownError': 'Unknown error:',
    'toast.digestCreating': 'Creating digest...',
    'toast.digestSuccess': 'Digest successfully created!',
    'toast.digestError': 'Error creating digest:',
    'toast.titleImproving': 'Improving title...',
    'toast.titleImproved': 'Title improved successfully!',
    'toast.titleError': 'Error improving title:',
    'toast.summaryGenerating': 'Generating summary...',
    'toast.summaryGenerated': 'Summary generated!',
    'toast.summaryError': 'Error generating summary:',
    'toast.student_news_error': 'Error loading student-relevant news:',
    
    // Error messages
    'error.functionError': 'Supabase function error:',
    'error.httpError': 'HTTP',
    'error.unknownStatus': 'unknown status',
    'error.couldNotParse': 'Could not parse error response:',
    
    // Newsletter components
    'newsletter.subscribe': 'Subscribe to Newsletter',
    'newsletter.subscribing': 'Subscribing...',
    'newsletter.subscribeTitle': 'Subscribe to AI Newsletter',
    'newsletter.emailValidation': 'Please enter a valid email address.',
    'newsletter.emailLabel': 'Email Address',
    'newsletter.emailPlaceholder': 'your.email@example.com',
    'newsletter.emailDescription': 'We only use your email address to send you the newsletter.',
    'newsletter.successTitle': 'Registration successful!',
    'newsletter.successDescription': 'Please confirm your email address via the link we sent you.',
    'newsletter.errorMessage': 'An error occurred. Please try again later.',
    'newsletter.successToast': 'Thank you for your interest! You will receive a confirmation email soon.',
    'newsletter.description': 'Receive the most important AI news directly in your inbox every Tuesday morning.',
    'newsletter.alreadyRegistered': 'This email is already registered. Thank you for your interest!',
    'newsletter.confirmEmail': 'Please confirm your email address via the link we sent you.',
    'newsletter.weeklyFrequency': 'We send our newsletter once a week.',
    'newsletter.unsubscribeAnytime': 'You can unsubscribe from the newsletter at any time.',
    'newsletter.adminAccess': 'Administrator Access',

    // Admin Panel
    'admin.newsletterManagement': 'Newsletter Management',
    'admin.backToSubscribe': 'Back to Subscribe',
    'admin.newsletterSend': 'Newsletter Send',
    'admin.newsletterArchive': 'Newsletter Archive',
    'admin.sendHistory': 'Send History',
    'admin.manageSettings': 'Manage your newsletter settings and send newsletters from the archive.',
    'admin.basicSettings': 'Basic Settings',
    'admin.newsletterSelection': 'Newsletter Selection',
    'admin.preview': 'Preview',
    'admin.subscribers': 'Subscribers',
    'admin.clickLoad': 'Click \'Load\'',
    'admin.load': 'Load',
    'admin.loading': 'Loading...',
    'admin.sendTime': 'Send Time',
    'admin.senderName': 'Sender Name',
    'admin.senderEmail': 'Sender Email',
    'admin.sendNewsletterNow': 'Send Newsletter Now',
    'admin.confirmedSubscribers': 'confirmed subscribers',
    'admin.newsletterSubject': 'Newsletter Subject',
    'admin.selectFromArchive': 'Select Newsletter from Archive',
    'admin.loadingArchive': 'Loading Archive...',
    'admin.selectNewsletter': 'Select Newsletter',
    'admin.selectedContent': 'Selected Newsletter Content',
    'admin.contentPlaceholder': 'Newsletter content will be displayed here...',
    'admin.generatePreview': 'Generate Preview',
    'admin.from': 'From:',
    'admin.subscribeReceived': 'You are receiving this newsletter because you subscribed to it.',
    'admin.unsubscribeHere': 'Unsubscribe here',
    'admin.selectNewsletterAndGenerate': 'Please select a newsletter and click \'Generate Preview\'.',
    'admin.sendingNewsletter': 'Sending newsletter...',

    // Weekly Digest components
    'weeklyDigest.editTop10': 'Edit Top 10',
    'weeklyDigest.editArticles': 'Edit Articles',
    'weeklyDigest.saveToArchive': 'Save to Archive',
    'weeklyDigest.saving': 'Saving...',
    'weeklyDigest.saved': 'Saved',

    // News Card components
    'newsCard.readArticle': 'Read Article',
    'newsCard.aiSummary': 'AI Summary',
    'newsCard.generatingSummary': 'AI Summary is being generated...',
    'newsCard.generateSummary': 'AI Summary based on real article',
    'newsCard.summaryError': 'Error generating summary',
    'newsCard.summaryGenerated': 'AI Summary generated based on real article',
    'newsCard.noSummaryReceived': 'No summary received',

    // UI Elements
    'ui.showMore': 'Show more',
    'ui.showLess': 'Show less',
    'ui.allArticles': 'All Articles',
    'ui.top10': 'Top 10',
    'ui.news': 'News',
    'ui.newsletter': 'Newsletter',
    'ui.questions': 'Questions',
    'ui.qa': 'Q&A',
    'ui.autoNewsletter': 'Auto-Newsletter',
    'ui.createNewsletter': 'Create Newsletter',
    'ui.regenerate': 'Regenerate',
    'ui.generating': 'Generating...',
    'ui.generatingAuto': 'Generating automatically...',
    'ui.topRelevantArticles': 'most relevant articles (automatically selected)',
    'ui.selectedArticles': 'selected articles for newsletter',
    'ui.selected': 'selected',
    'ui.analysisRealContent': 'Analyzing real article content...',
    'ui.analysisRealContentShort': 'Analyzing real content...',
    'ui.noArticlesFound': 'No articles found',
    'ui.tryReloadNews': 'Try reloading the news',
    'ui.articlesLoading': 'Articles are loading...',

    // Database page
    'database.title': 'AI News Database',
    'database.subtitle': 'Search and discover AI news sorted by thematic clusters and relevance',
    'database.searchPlaceholder': 'Search for articles...',
    'database.selectCluster': 'Select cluster',
    'database.allClusters': 'All Clusters',
    'database.sortByRelevance': 'By Relevance',
    'database.sortByClusterRelevance': 'By Cluster Relevance',
    'database.sortByDate': 'By Date',
    'database.descending': 'Descending',
    'database.ascending': 'Ascending',
    'database.cards': 'Cards',
    'database.list': 'List',
    'database.all': 'All',
    'database.noArticlesAvailable': 'No articles available yet',
    'database.loadArticlesFirst': 'First load some articles via the main page or use the RSS Debug Test.',
    'database.loadArticles': 'Load Articles',
    'database.toMainPage': 'To Main Page',
    'database.errorLoading': 'Error Loading',
    'database.tryAgain': 'Try Again',
    'database.noArticlesFoundError': 'No articles found. Try reloading the page.',
    'database.articlesLoadedAndClassified': 'articles loaded and classified by relevance',
    'database.errorLoadingArticles': 'Error loading articles',
    'database.articlesOf': 'of',
    'database.articles': 'articles',
    'database.noArticlesFoundInFilter': 'No articles found',
    'database.tryDifferentSearch': 'Try a different search or remove filters',
    'database.reloadToLoad': 'Reload the page to load articles',
    'database.reloadArticles': 'Reload Articles',

    // AI Clusters
    'clusters.modellentwicklung': 'Model Development',
    'clusters.governanceEthik': 'Governance & Ethics',
    'clusters.educationLearning': 'Education & Learning',
    'clusters.useCases': 'Use Cases',
    'clusters.geopolitischeDynamiken': 'Geopolitical Dynamics',
    'clusters.wirtschaftMarkt': 'Economy & Market',
    
    // Cluster Descriptions
    'clusters.modellentwicklungDesc': 'Advances in AI model development and architecture',
    'clusters.governanceEthikDesc': 'Ethical challenges and regulatory developments',
    'clusters.educationLearningDesc': 'AI in education and learning processes',
    'clusters.useCasesDesc': 'Practical applications of AI in various industries',
    'clusters.geopolitischeDynamikenDesc': 'International AI policy and geopolitical tensions',
    'clusters.wirtschaftMarktDesc': 'Market developments and economic aspects of AI',

    // General
    'general.loading': 'Loading...',
    'general.error': 'Error',
    'general.success': 'Success',
    'general.cancel': 'Cancel',
    'general.save': 'Save',
    'general.delete': 'Delete',
    'general.edit': 'Edit',
    'general.create': 'Create',
    'general.week': 'Week',
  }
}; 