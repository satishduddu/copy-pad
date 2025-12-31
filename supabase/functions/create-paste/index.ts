import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, x-test-now-ms',
};

function generateId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { content, ttl_seconds, max_views } = body;

    if (!content || typeof content !== 'string' || content.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Content is required and must be a non-empty string' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (ttl_seconds !== undefined && (typeof ttl_seconds !== 'number' || ttl_seconds < 1 || !Number.isInteger(ttl_seconds))) {
      return new Response(
        JSON.stringify({ error: 'ttl_seconds must be an integer >= 1' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (max_views !== undefined && (typeof max_views !== 'number' || max_views < 1 || !Number.isInteger(max_views))) {
      return new Response(
        JSON.stringify({ error: 'max_views must be an integer >= 1' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const testMode = Deno.env.get('TEST_MODE') === '1';
    const testNowMs = req.headers.get('x-test-now-ms');
    const now = testMode && testNowMs ? new Date(parseInt(testNowMs)) : new Date();

    const id = generateId();
    const expires_at = ttl_seconds ? new Date(now.getTime() + ttl_seconds * 1000) : null;
    const remaining_views = max_views || null;

    const { error } = await supabase.from('pastes').insert({
      id,
      content,
      ttl_seconds: ttl_seconds || null,
      max_views: max_views || null,
      remaining_views,
      created_at: now.toISOString(),
      expires_at: expires_at?.toISOString() || null,
    });

    if (error) {
      throw error;
    }

    const deploymentUrl = supabaseUrl.replace('.supabase.co', '.vercel.app');
    const url = `${req.headers.get('origin') || deploymentUrl}/p/${id}`;

    return new Response(
      JSON.stringify({ id, url }),
      {
        status: 201,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating paste:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});