
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the authorization header from the request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }
    
    // Get the current user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Error fetching user or user not found");
    }
    
    // Parse the request body
    const requestData = await req.json();
    const { returnUrl, planId = "premium" } = requestData;
    
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Missing Stripe secret key");
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });
    
    // Check if the user already exists in Stripe
    let customerId;
    
    try {
      const customerSearchResults = await stripe.customers.search({
        query: `email:'${user.email}'`,
      });
      
      if (customerSearchResults.data.length > 0) {
        // Use existing customer
        customerId = customerSearchResults.data[0].id;
      } else {
        // Create new customer
        const newCustomer = await stripe.customers.create({
          email: user.email,
          name: user.user_metadata?.name || user.email,
          metadata: {
            supabase_uid: user.id,
            store_name: user.user_metadata?.store_name || '',
          },
        });
        
        customerId = newCustomer.id;
      }
    } catch (stripeError) {
      console.error('Error with Stripe customer:', stripeError);
      // Fallback to creating a new customer if search fails
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.name || user.email,
        metadata: {
          supabase_uid: user.id,
        },
      });
      
      customerId = newCustomer.id;
    }

    // Set product and price IDs based on plan
    let priceId;
    let productName = "Game Room Management Premium Subscription";
    let unitAmount = 39900; // $399.00 for premium plan

    // For future use if we add more plans
    if (planId === "basic") {
      unitAmount = 19900; // $199.00
      productName = "Game Room Management Basic Subscription";
    } else if (planId === "enterprise") {
      unitAmount = 99900; // $999.00
      productName = "Game Room Management Enterprise Subscription";
    }
    
    console.log("Creating checkout session for customer:", customerId);
    
    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: productName,
              description: "Monthly subscription for Game Room Management System",
            },
            unit_amount: unitAmount,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${returnUrl || req.headers.get("origin")}?success=true`,
      cancel_url: `${returnUrl || req.headers.get("origin")}?canceled=true`,
      metadata: {
        user_id: user.id,
        store_name: user.user_metadata?.store_name || '',
        plan_id: planId,
      },
    });
    
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
