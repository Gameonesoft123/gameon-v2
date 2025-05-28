
import { supabase } from "./client";

export async function fixExistingCustomers() {
  try {
    // Step 1: Get all customers with missing store_id
    const { data: customersWithoutStore, error: fetchError } = await supabase
      .from('customers')
      .select('id')
      .is('store_id', null);
    
    if (fetchError) throw fetchError;
    
    if (!customersWithoutStore || customersWithoutStore.length === 0) {
      console.log('No customers found without store_id');
      return { success: true, message: 'No customers need fixing' };
    }
    
    // Step 2: Get all stores
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .limit(1);
      
    if (storesError) throw storesError;
    
    if (!stores || stores.length === 0) {
      console.error('No stores found to assign customers to');
      return { success: false, message: 'No stores found' };
    }
    
    // Assign all orphaned customers to the first store
    const defaultStoreId = stores[0].id;
    
    // Step 3: Update all customers with missing store_id
    const customerIds = customersWithoutStore.map(c => c.id);
    
    const { error: updateError } = await supabase
      .from('customers')
      .update({ store_id: defaultStoreId })
      .in('id', customerIds);
      
    if (updateError) throw updateError;
    
    return { 
      success: true, 
      message: `✅ Fixed ${customerIds.length} customers by assigning them to store ${defaultStoreId}` 
    };
    
  } catch (error) {
    console.error('Error fixing customers:', error);
    return { success: false, message: `Error fixing customers: ${error.message || 'Unknown error occurred'}` };
  }
}
