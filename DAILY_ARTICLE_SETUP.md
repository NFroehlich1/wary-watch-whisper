# Automatisches Tägliches Artikel-Laden Einrichten

## Übersicht
Dieses Setup stellt sicher, dass neue Artikel von The Decoder automatisch 3x täglich geladen werden.

## Option 1: SQL-Setup (Empfohlen)

### Schritt 1: Supabase SQL Editor öffnen
1. Gehen Sie zu Ihrem Supabase Dashboard
2. Navigieren Sie zu SQL Editor
3. Erstellen Sie eine neue Query

### Schritt 2: SQL ausführen
Kopieren Sie den Inhalt aus `setup-daily-article-cron.sql` und führen Sie ihn aus.

Das SQL-Script richtet automatisch 3 Cron Jobs ein:
- **Morgens**: 8:00 UTC (10:00 MEZ)
- **Mittags**: 14:00 UTC (16:00 MEZ) 
- **Abends**: 20:00 UTC (22:00 MEZ)

### Schritt 3: Überprüfung
```sql
-- Cron Jobs anzeigen
select jobname, schedule, active from cron.job where jobname like '%decoder%';

-- Job-Verlauf anzeigen
select * from cron.job_run_details where jobname like '%decoder%' order by end_time desc limit 10;
```

## Option 2: Supabase Dashboard UI

### Schritt 1: Cron Module aktivieren
1. Gehen Sie zu Ihrem Supabase Dashboard
2. Navigieren Sie zu **Integrations**
3. Aktivieren Sie das **Cron** Module

### Schritt 2: Job erstellen
1. Gehen Sie zu **Integrations → Cron**
2. Klicken Sie auf **Create Job**
3. Konfiguration:
   - **Name**: `daily-decoder-articles`
   - **Schedule**: `0 8,14,20 * * *` (3x täglich)
   - **Type**: Edge Function
   - **Function**: `daily-article-processor`
   - **Body**:
   ```json
   {
     "sources": ["https://the-decoder.de/feed/"],
     "maxArticlesPerSource": 15,
     "enableAiScoring": true,
     "forceRefresh": false
   }
   ```

## Zeitpläne

### Aktuelle Einstellung
- **8:00 UTC** (10:00 MEZ) - Morgen-Update
- **14:00 UTC** (16:00 MEZ) - Mittag-Update  
- **20:00 UTC** (22:00 MEZ) - Abend-Update

### Alternative Zeitpläne
```bash
# Alle 6 Stunden
0 */6 * * *

# Nur einmal täglich um 9:00 MEZ
0 7 * * *

# Alle 4 Stunden (6, 10, 14, 18, 22 Uhr MEZ)
0 4,8,12,16,20 * * *
```

## Überwachung

### Cron Job Status prüfen
```sql
-- Aktive Jobs
select * from cron.job where active = true;

-- Letzte Ausführungen
select 
  jobname,
  start_time,
  end_time,
  status,
  return_message
from cron.job_run_details 
where jobname like '%decoder%' 
order by end_time desc 
limit 20;
```

### Logs im Dashboard
1. Gehen Sie zu **Integrations → Cron**
2. Klicken Sie auf **History** bei Ihrem Job
3. Überprüfen Sie Success/Failure Status

## Erweiterte Konfiguration

### Mehr Quellen hinzufügen
```json
{
  "sources": [
    "https://the-decoder.de/feed/",
    "https://techcrunch.com/category/artificial-intelligence/feed/",
    "https://feeds.feedburner.com/oreilly/radar"
  ],
  "maxArticlesPerSource": 10,
  "enableAiScoring": true,
  "forceRefresh": false
}
```

### Job deaktivieren/löschen
```sql
-- Job pausieren
select cron.alter_job('daily-decoder-articles-morning', schedule := null, active := false);

-- Job komplett löschen
select cron.unschedule('daily-decoder-articles-morning');
```

## Troubleshooting

### Probleme mit Edge Function
1. Überprüfen Sie Edge Function Logs im Dashboard
2. Testen Sie die Function manuell
3. Überprüfen Sie Supabase Service Role Key

### Keine neuen Artikel
1. Prüfen Sie ob The Decoder RSS Feed verfügbar ist
2. Überprüfen Sie die Cron Job Logs
3. Prüfen Sie die `daily_raw_articles` Tabelle

### Timeout-Probleme
Erhöhen Sie das Timeout:
```sql
timeout_milliseconds:=60000  -- 60 Sekunden
```

## Status nach Setup

Nach erfolgreichem Setup:
✅ **Automatisches Laden**: 3x täglich neue Artikel
✅ **KI-Scoring**: Automatische Relevanz-Bewertung  
✅ **Duplikat-Schutz**: Verhindert doppelte Artikel
✅ **Monitoring**: Logs und Status-Überwachung 