import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      role,
      username,
      password,
      storeId,
    } = body;

    // Create user with admin privileges
    const { data: authData, error: adminError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

    if (adminError) throw adminError;
    if (!authData.user) throw new Error("Failed to create user account");

    // Create staff record
    const { error: staffError } = await supabase.from("staff").insert({
      user_id: authData.user.id,
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phoneNumber,
      role,
      username,
      store_id: storeId,
    });

    if (staffError) throw staffError;

    return new Response(
      JSON.stringify({ success: true, user: authData.user }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
