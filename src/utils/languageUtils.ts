// Language utilities for the application
export const detectLanguage = (text: string): 'de' | 'en' => {
  const germanWords = ['der', 'die', 'das', 'und', 'oder', 'mit', 'von', 'zu', 'in', 'auf', 'für', 'ist', 'sind', 'wird', 'werden'];
  const englishWords = ['the', 'and', 'or', 'with', 'from', 'to', 'in', 'on', 'for', 'is', 'are', 'will', 'be'];
  
  const words = text.toLowerCase().split(/\s+/);
  let germanScore = 0;
  let englishScore = 0;
  
  words.forEach(word => {
    if (germanWords.includes(word)) germanScore++;
    if (englishWords.includes(word)) englishScore++;
  });
  
  return germanScore > englishScore ? 'de' : 'en';
};

export const translateText = (text: string, targetLang: 'de' | 'en'): string => {
  // Simple placeholder - in a real app you'd use a translation service
  return text;
};

export default {
  detectLanguage,
  translateText
}; 