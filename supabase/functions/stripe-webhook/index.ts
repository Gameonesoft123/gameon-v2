import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Missing Stripe secret key");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
    
    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No signature provided");
    }

    // Get the raw body as text
    const body = await req.text();
    
    // Initialize Supabase client to update the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // This would be your webhook endpoint secret from the Stripe Dashboard
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    let event;
    
    // If we have a webhook secret, verify the signature
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new Response(`Webhook signature verification failed: ${err.message}`, { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    } else {
      // For testing without signature verification
      event = JSON.parse(body);
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        // Extract customer information
        const customerId = session.customer;
        const customerEmail = session.customer_details?.email;
        const metadata = session.metadata || {};
        const userId = metadata.user_id;
        const storeName = metadata.store_name;
        const planId = metadata.plan_id || "premium";
        
        console.log(`Processing checkout session: ${session.id} for customer: ${customerId} (${customerEmail})`);
        console.log(`User ID: ${userId}, Store: ${storeName}, Plan: ${planId}`);

        // Handle subscription creation/update in your database
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          
          // Update or insert subscription information in your database
          const { data: existingSub, error: fetchError } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error("Error fetching existing subscription:", fetchError);
          }

          const subscriptionData = {
            user_id: userId,
            plan_id: planId, 
            status: subscription.status,
            start_date: new Date(subscription.current_period_start * 1000).toISOString(),
            end_date: new Date(subscription.current_period_end * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId
          };

          if (existingSub) {
            // Update existing subscription
            const { error: updateError } = await supabase
              .from('user_subscriptions')
              .update(subscriptionData)
              .eq('id', existingSub.id);
              
            if (updateError) {
              console.error("Error updating subscription:", updateError);
            } else {
              console.log(`Updated existing subscription: ${existingSub.id}`);
            }
          } else {
            // Create new subscription
            const { error: insertError } = await supabase
              .from('user_subscriptions')
              .insert(subscriptionData);
              
            if (insertError) {
              console.error("Error inserting subscription:", insertError);
            } else {
              console.log(`Created new subscription for user: ${userId}`);
            }
          }
        }
        
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        // Update subscription status in your database
        console.log(`Subscription ${subscription.id} updated: ${subscription.status}`);
        
        // Get the user ID from metadata or look it up in your database
        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();
          
        if (subData) {
          const { error: updateError } = await supabase
            .from('user_subscriptions')
            .update({
              status: subscription.status,
              start_date: new Date(subscription.current_period_start * 1000).toISOString(),
              end_date: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);
            
          if (updateError) {
            console.error("Error updating subscription:", updateError);
          } else {
            console.log(`Updated subscription status: ${subscription.status}`);
          }
        } else {
          console.log(`No matching subscription found for ${subscription.id}`);
        }
        
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        // Update or delete subscription in your database
        console.log(`Subscription ${subscription.id} canceled`);
        
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id);
          
        if (updateError) {
          console.error("Error updating canceled subscription:", updateError);
        } else {
          console.log(`Marked subscription as canceled: ${subscription.id}`);
        }
        
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500
    });
  }
});
