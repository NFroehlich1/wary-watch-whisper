-- Setup automatic daily article loading for The Decoder
-- Run this SQL in your Supabase SQL Editor to enable automatic article fetching

-- First, store the project URL and anon key in Supabase Vault for security
-- Replace 'YOUR_PROJECT_URL' and 'YOUR_ANON_KEY' with your actual values
select vault.create_secret('https://aggkhetcdjmggqjzelgd.supabase.co', 'project_url');
select vault.create_secret('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZ2toZXRjZGptZ2dxanplbGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mjk4NjUsImV4cCI6MjA2MjAwNTg2NX0.XW9bhjKknGFfgkIW9poUsTM8h_GwFZCWz0duZvT4bJ0', 'anon_key');

-- Schedule daily article processing at 8:00 AM, 2:00 PM, and 8:00 PM (UTC)
select cron.schedule(
    'daily-decoder-articles-morning',
    '0 8 * * *', -- Every day at 8:00 AM UTC
    $$
    select
      net.http_post(
          url:= (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/daily-article-processor',
          headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
          ),
          body:=jsonb_build_object(
            'sources', array['https://the-decoder.de/feed/'],
            'maxArticlesPerSource', 15,
            'enableAiScoring', true,
            'forceRefresh', false
          ),
          timeout_milliseconds:=30000
      ) as request_id;
    $$
);

-- Schedule afternoon article processing
select cron.schedule(
    'daily-decoder-articles-afternoon',
    '0 14 * * *', -- Every day at 2:00 PM UTC
    $$
    select
      net.http_post(
          url:= (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/daily-article-processor',
          headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
          ),
          body:=jsonb_build_object(
            'sources', array['https://the-decoder.de/feed/'],
            'maxArticlesPerSource', 15,
            'enableAiScoring', true,
            'forceRefresh', false
          ),
          timeout_milliseconds:=30000
      ) as request_id;
    $$
);

-- Schedule evening article processing
select cron.schedule(
    'daily-decoder-articles-evening',
    '0 20 * * *', -- Every day at 8:00 PM UTC
    $$
    select
      net.http_post(
          url:= (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/daily-article-processor',
          headers:=jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
          ),
          body:=jsonb_build_object(
            'sources', array['https://the-decoder.de/feed/'],
            'maxArticlesPerSource', 15,
            'enableAiScoring', true,
            'forceRefresh', false
          ),
          timeout_milliseconds:=30000
      ) as request_id;
    $$
);

-- Optional: Check existing cron jobs
select jobname, schedule, active from cron.job where jobname like '%decoder%';

-- Optional: Unschedule jobs if needed (uncomment to use)
-- select cron.unschedule('daily-decoder-articles-morning');
-- select cron.unschedule('daily-decoder-articles-afternoon');
-- select cron.unschedule('daily-decoder-articles-evening'); 