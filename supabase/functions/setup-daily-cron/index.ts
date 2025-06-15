import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== SETTING UP AUTOMATIC DAILY ARTICLE LOADING ===');

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store secrets in Vault (if not already exists)
    console.log('Setting up Vault secrets...');
    
    try {
      await supabase.rpc('vault.create_secret', {
        secret: supabaseUrl,
        name: 'project_url'
      });
      console.log('✅ Project URL stored in Vault');
    } catch (error) {
      console.log('Project URL secret may already exist');
    }

    try {
      await supabase.rpc('vault.create_secret', {
        secret: supabaseAnonKey,
        name: 'anon_key'
      });
      console.log('✅ Anon key stored in Vault');
    } catch (error) {
      console.log('Anon key secret may already exist');
    }

    // Setup cron jobs
    const cronJobs = [
      {
        name: 'daily-decoder-articles-morning',
        schedule: '0 8 * * *',
        description: 'Morning article processing (8:00 UTC)'
      },
      {
        name: 'daily-decoder-articles-afternoon', 
        schedule: '0 14 * * *',
        description: 'Afternoon article processing (14:00 UTC)'
      },
      {
        name: 'daily-decoder-articles-evening',
        schedule: '0 20 * * *',
        description: 'Evening article processing (20:00 UTC)'
      }
    ];

    const results = [];

    for (const job of cronJobs) {
      try {
        console.log(`Setting up cron job: ${job.name}`);

        // Create cron job
        const { data, error } = await supabase.rpc('cron.schedule', {
          job_name: job.name,
          cron_schedule: job.schedule,
          sql_command: `
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
          `
        });

        if (error) {
          console.error(`Error setting up ${job.name}:`, error);
          results.push({
            job: job.name,
            success: false,
            error: error.message
          });
        } else {
          console.log(`✅ Successfully set up ${job.name}`);
          results.push({
            job: job.name,
            success: true,
            description: job.description
          });
        }
      } catch (jobError) {
        console.error(`Exception setting up ${job.name}:`, jobError);
        results.push({
          job: job.name,
          success: false,
          error: jobError.message
        });
      }
    }

    // Check current cron jobs
    console.log('Checking existing cron jobs...');
    const { data: existingJobs, error: jobsError } = await supabase
      .from('cron.job')
      .select('jobname, schedule, active')
      .like('jobname', '%decoder%');

    const summary = {
      timestamp: new Date().toISOString(),
      setupResults: results,
      existingJobs: existingJobs || [],
      successCount: results.filter(r => r.success).length,
      totalJobs: results.length
    };

    console.log('=== SETUP COMPLETE ===');
    console.log(`Successfully set up ${summary.successCount}/${summary.totalJobs} cron jobs`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Automatic daily article loading setup complete! ${summary.successCount}/${summary.totalJobs} jobs configured.`,
        summary,
        nextSteps: [
          'Articles will now be automatically loaded 3x daily',
          'Check Supabase Dashboard > Integrations > Cron to monitor jobs',
          'Jobs run at 8:00, 14:00, 20:00 UTC (10:00, 16:00, 22:00 MEZ)'
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in setup-daily-cron function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Failed to set up automatic daily article loading'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}); 