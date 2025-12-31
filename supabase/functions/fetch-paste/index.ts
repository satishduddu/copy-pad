import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, x-test-now-ms',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'GET') {
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
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Paste ID is required' }),
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

    const { data: paste, error: fetchError } = await supabase
      .from('pastes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!paste) {
      return new Response(
        JSON.stringify({ error: 'Paste not found' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (paste.expires_at && new Date(paste.expires_at) <= now) {
      return new Response(
        JSON.stringify({ error: 'Paste has expired' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (paste.remaining_views !== null && paste.remaining_views <= 0) {
      return new Response(
        JSON.stringify({ error: 'Paste view limit exceeded' }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let newRemainingViews = paste.remaining_views;
    if (paste.remaining_views !== null && paste.remaining_views > 0) {
      const { data: decremented } = await supabase
        .rpc('decrement_paste_views', { paste_id: id });
      
      if (decremented !== null && decremented !== undefined) {
        newRemainingViews = decremented;
      }
    }

    return new Response(
      JSON.stringify({
        content: paste.content,
        remaining_views: newRemainingViews,
        expires_at: paste.expires_at,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching paste:', error);
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