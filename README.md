# LINKIT WEEKLY KI – Automatischer Tech-Newsletter

**LINKIT WEEKLY KI** sammelt aktuelle KI- und Tech-Artikel, bewertet sie, erstellt daraus einen wöchentlichen Newsletter und beantwortet anschließende Leser­fragen – alles in einer Full-Stack-Plattform.

---

## 1  Funktions­überblick

| Bereich | Funktionen |
|---------|------------|
| **Artikel-Import** | • RSS-Feeds (The Decoder + eigene Quellen)  
• RSS-Quellen-Manager  
• Manuelles URL-Import-Formular  |
| **Bewertung & Kuration** | • Relevanz-Scoring  
• Top-10-Ranking mit Drag-&-Drop  
• Studenten-Filter  
• Dauerhaftes Löschen/Bearbeiten |
| **KI-Services (Gemini 1.5 Flash)** | • Wöchentliche Newsletter-Generierung  
• Titel-Optimierung per Button  
• Artikel-Zusammenfassungen |
| **Q-&-A** | • „Fragen zum Newsletter“-Chat  
• Dynamische Fragevorschläge  
• Archiv-Q-&-A (Suche über alle Ausgaben) |
| **Newsletter** | • Autom. Wochen-Digest  
• Editor für manuelle Anpassungen  
• Newsletter-Archiv mit Volltextsuche |
| **Abo & Versand** | • Double-Opt-In Registrierung  
• Autom. Versand via Edge Functions  
• Unsubscribe-Workflow |
| **Administration** | • Admin-Login & Dashboard  
• Debug-Tools für RSS & Gemini  
• Cron-Job-Verwaltung |

---

## 2  Technologie­stack (Kurz)
* React 18 + TypeScript, Tailwind CSS, shadcn/ui
* Supabase (PostgreSQL, Edge Functions / Deno)
* Google Gemini 1.5 Flash API
* Vite Build-System, Vitest für Tests

---

## 3  Verzeichnis­struktur (Auszug)
```
src/
├─ components/            # UI & Logik (NewsCard, WeeklyDigest, Q&A, …)
├─ pages/                 # Index, Newsletter, StudentNews, ArchiveQA
├─ services/              # NewsService, DigestService, RSS-Services, …
├─ integrations/          # Supabase Client, Gemini API
supabase/functions/       # Edge Functions (rss, gemini-ai, newsletter-send …)
```

---

## 4  Installation (lokal)
```bash
git clone https://github.com/NFroehlich1/LinkitWeeklyAI.git
cd LinkitWeeklyAI
npm install
npm run dev         # Entwicklungs­server starten
```

### Benötigte Umgebungs­variablen
| Name | Zweck |
|------|-------|
| `SUPABASE_URL` | Supabase Projekt-URL |
| `SUPABASE_ANON_KEY` | Public API Key |
| `GEMINI_API_KEY` | Key aus Google AI Studio |

Variablen werden im Supabase-Dashboard unter **Edge Functions → Settings → Environment Variables** hinterlegt.

---

## 5  Typischer Workflow
1. **Artikel importieren** – automatisch (Cron) oder manuell (RSS-Debug-Button).
2. **Top 10 kuratieren** – Ranking anpassen, Titel optimieren.
3. **Newsletter generieren** – KI erstellt Inhalt, Admin prüft & veröffentlicht.
4. **Versand & Archivierung** – Ausgabe wird gespeichert und an Abonnenten gesendet.
5. **Fragen beantworten** – Leser stellen Fragen im Q-&-A (aktuelle Ausgabe oder Archiv).

---

## 6  Automatisierung
* **Täglich**: RSS-Import, Duplikat-Check, Qualitäts­prüfung.
* **Wöchentlich**: Top-Artikel-Selektion, KI-Newsletter, Versand.
Cron-Jobs werden im Repository (Ordner `supabase/functions/setup-daily-cron`) bereitgestellt.

---

## 7  Lizenz
MIT License – siehe `LICENSE`.

---

© LINKIT Karlsruhe
