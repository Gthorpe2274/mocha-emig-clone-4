import { JobQueue } from './job-queue';
import { runScheduledCleanup } from './retention-cleanup';

export async function handleScheduled(env: Env, event?: ScheduledEvent): Promise<Response> {
  console.log('=== CRON JOB: Processing scheduled tasks ===');
  
  try {
    // Determine which tasks to run based on cron schedule
    const cronPattern = event?.cron;
    
    // Daily retention cleanup (2 AM UTC)
    if (cronPattern === '0 2 * * *') {
      console.log('Running daily retention cleanup...');
      return await runScheduledCleanup(env);
    }
    
    // Report generation jobs (every 10 minutes or default)
    if (cronPattern === '*/10 * * * *' || !cronPattern) {
      console.log('Processing pending report generation jobs...');
      
      if (!env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY not configured for cron job');
        return new Response('OpenAI API key not configured', { status: 500 });
      }

      const jobQueue = new JobQueue(env.DB, env.REPORTS_KV, env.OPENAI_API_KEY);
      
      // Process up to 5 pending jobs per cron run
      await jobQueue.processPendingJobs();
      
      console.log('Report generation job processing completed');
      return new Response('Report jobs processed', { status: 200 });
    }
    
    console.log('No matching cron pattern, skipping tasks');
    return new Response('No tasks scheduled for this pattern', { status: 200 });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return new Response('Error processing scheduled tasks', { status: 500 });
  }
}

// Export for use in worker index
export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(handleScheduled(env));
  }
};
