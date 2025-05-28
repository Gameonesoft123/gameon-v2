
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Setup Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured')
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse the request body
    const { user_id, store_name, update_only, store_id: providedStoreId } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`Processing request for user ${user_id} - update_only: ${update_only}, store_id: ${providedStoreId}, store_name: ${store_name}`)
    
    // If this is an update-only operation and we have a provided store_id
    if (update_only && providedStoreId) {
      console.log(`Updating user ${user_id} with existing store ID ${providedStoreId}`)
      
      // Check if the store exists
      const { data: storeCheck, error: storeCheckError } = await supabase
        .from('stores')
        .select('id')
        .eq('id', providedStoreId)
        .maybeSingle()
        
      if (storeCheckError) {
        console.error('Error checking store:', storeCheckError)
        throw storeCheckError
      }
      
      if (!storeCheck) {
        return new Response(
          JSON.stringify({ error: 'The provided store_id does not exist' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      // Update the user's profile with the store_id
      await updateUserProfile(supabase, user_id, providedStoreId)
      
      // Update user metadata
      await updateUserMetadata(supabase, user_id, providedStoreId)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          store_id: providedStoreId,
          message: 'User associated with existing store'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Normal create store flow
    if (!store_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: store_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Creating store "${store_name}" for user ${user_id}`)
    
    // Create the store
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .insert({ name: store_name })
      .select('id')
      .single()

    if (storeError) {
      console.error('Error creating store:', storeError)
      throw storeError
    }

    const storeId = storeData.id
    console.log(`Store created with ID: ${storeId}`)
    
    // Update the user's profile with the store_id
    await updateUserProfile(supabase, user_id, storeId)
    
    // Update user metadata
    await updateUserMetadata(supabase, user_id, storeId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        store_id: storeId,
        message: 'Store created and associated with user'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error in create-user-store function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper function to update user profile
async function updateUserProfile(supabase, userId, storeId) {
  console.log(`updateUserProfile: Updating user ${userId} with store ID ${storeId}`)
  
  // Check if profile exists
  const { data: existingProfile, error: checkError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()
  
  if (checkError && checkError.code !== 'PGRST116') {
    console.error("Error checking for profile:", checkError)
    throw checkError
  }
  
  if (existingProfile) {
    // Update existing profile
    console.log("Updating existing profile")
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ store_id: storeId })
      .eq('id', userId)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      throw profileError
    }
    
    console.log("Profile updated successfully")
  } else {
    // Insert new profile
    console.log("Creating new profile")
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({ 
        id: userId, 
        store_id: storeId,
        role: 'owner' // Default role for new profiles
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      throw profileError
    }
    
    console.log("New profile created successfully")
  }
}

// Helper function to update user metadata
async function updateUserMetadata(supabase, userId, storeId) {
  console.log(`updateUserMetadata: Updating user ${userId} metadata with store ID ${storeId}`)
  
  // First get current metadata
  const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(userId)
  
  if (getUserError) {
    console.error('Error getting user metadata:', getUserError)
    throw getUserError
  }
  
  // Merge existing metadata with new store_id
  const updatedMetadata = {
    ...userData.user.user_metadata,
    store_id: storeId
  }
  
  console.log(`Updating user metadata to include store_id: ${storeId}`)
  
  // Update user metadata
  const { error: userError } = await supabase.auth.admin.updateUserById(
    userId,
    {
      user_metadata: updatedMetadata
    }
  )

  if (userError) {
    console.error('Error updating user metadata:', userError)
    throw userError
  }
  
  console.log("User metadata updated successfully")
}
