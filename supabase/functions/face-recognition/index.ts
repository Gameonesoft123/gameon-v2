
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Dynamic CORS headers based on the request origin (for POST and errors)
const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS', // Explicitly allow POST and OPTIONS
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', // Keep comprehensive headers
    // 'Access-Control-Max-Age': '86400' // Optional: Can be added if needed
  };
};

serve(async (req: Request) => {
  // Log the incoming origin header
  console.log(`Request received. Method: ${req.method}, Origin: ${req.headers.get("origin")}`);

  // Handle CORS preflight requests (OPTIONS)
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request with wildcard origin.');
    return new Response(null, {
      status: 204, // No Content
      headers: {
        'Access-Control-Allow-Origin': '*', // Use wildcard for OPTIONS
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization', // As per user request
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  try {
    const AZURE_FACE_API_KEY = Deno.env.get('AZURE_FACE_API_KEY')
    const AZURE_FACE_ENDPOINT = Deno.env.get('AZURE_FACE_ENDPOINT')
    
    if (!AZURE_FACE_API_KEY || !AZURE_FACE_ENDPOINT) {
      console.error("Azure Face API credentials are not configured in Edge Function.")
      return new Response(
        JSON.stringify({ error: 'Azure Face API credentials are not configured' }),
        {
          status: 500,
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
        }
      );
    }

    // Ensure body is read only for POST requests after OPTIONS handling
    if (req.method !== 'POST') {
        console.warn(`Method ${req.method} not allowed. Only POST and OPTIONS are handled.`);
        return new Response(
            JSON.stringify({ error: `Method ${req.method} not allowed.` }),
            {
                status: 405, // Method Not Allowed
                headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' }
            }
        );
    }
    
    const body = await req.json()
    if (!body) {
      console.error("Request body is missing or not valid JSON.")
      return new Response(
        JSON.stringify({ error: "Invalid request: Missing or malformed JSON body." }),
        {
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    const { action, image, faceId, userId, customerId } = body;

    console.log(`Received action: ${action}, image provided: ${!!image}, faceId provided: ${!!faceId}, userId provided: ${!!userId}, customerId provided: ${!!customerId}`);

    if (action === 'detect' && image) {
      console.log("Detecting face in image (mock)")
      const mockFaceId = `face_${Math.random().toString(36).substring(2, 15)}`;
      return new Response(
        JSON.stringify({
          success: true,
          faceId: mockFaceId,
          confidence: 0.98
        }),
        {
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }
    
    if (action === 'identify' && image) {
      console.log("Identifying face in image (mock)")
      const mockFaceIdFromIdentify = `face_${Math.random().toString(36).substring(2, 15)}`;
      const mockIdentifiedUserId = body.customerId || `user_${Math.random().toString(36).substring(2, 10)}`; 
      return new Response(
        JSON.stringify({
          success: true,
          externalImageId: mockIdentifiedUserId,
          confidence: 0.95
        }),
        {
          headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }
    
    if (action === 'register' && image && customerId) {
        console.log(`Registering face for customerId: ${customerId} (mock)`);
        return new Response(
            JSON.stringify({
                success: true,
                customerId: customerId,
                message: "Face registered successfully (mock)."
            }),
            {
                headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    }

    console.warn(`Invalid or unhandled action: ${action}. Full body:`, body);
    return new Response(
      JSON.stringify({ 
        error: `Invalid request. Action '${action}' is not supported or required parameters are missing.` 
      }),
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  } catch (error) {
    console.error("Error in face recognition function:", error);
    return new Response(
      JSON.stringify({ error: error.message, details: String(error), stack: error.stack }), 
      {
        headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

