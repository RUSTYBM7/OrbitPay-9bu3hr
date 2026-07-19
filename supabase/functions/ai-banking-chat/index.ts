import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');

    const { messages, userContext } = await req.json();

    const systemPrompt = `You are OrbitPay's AI Banking Assistant — a friendly, expert financial advisor embedded in the OrbitPay Finance app. You have access to the user's financial context below and use it to give personalized, actionable advice.

USER FINANCIAL CONTEXT:
- Name: ${userContext?.name ?? 'User'}
- Tier: ${userContext?.tier ?? 'Standard'}
- Primary Wallet Balance: ${userContext?.primaryBalance ?? 'N/A'}
- Total Crypto Value: $${userContext?.cryptoValue ?? '0'}
- Total Investment Value: $${userContext?.investmentValue ?? '0'}
- Recent Transaction Count: ${userContext?.recentTxCount ?? '0'} in last 30 days
- KYC Status: ${userContext?.kycStatus ?? 'Unverified'}

CAPABILITIES:
- Answer questions about the user's balance, transactions, and portfolio
- Provide personalized spending insights and budget advice
- Explain crypto/investment concepts and market conditions
- Help with bill payments, transfers, and account management
- Guide users through KYC, card features, and savings goals
- Detect spending patterns and flag unusual activity

GUIDELINES:
- Keep responses concise and practical (2-4 sentences max unless detail requested)
- Use the user's financial context to personalize answers
- Format numbers with proper currency symbols
- Always prioritize user financial security and privacy
- For complex financial decisions, recommend consulting a licensed advisor
- Use a warm, professional tone — like a knowledgeable friend who understands finance
- Respond in the same language the user writes in`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API Error:', errText);
      return new Response(JSON.stringify({ error: `AI error: ${errText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Stream response back to client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (err) {
    console.error('Edge Function Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
