import { supabaseDataProvider } from "ra-supabase"
import { supabase } from "./supabaseClient"

// TEMPORARY SIMPLIFIED DATA PROVIDER
// This removes the RPC function and just uses the base provider
// Use this until we fix the search_profiles function

const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_API_KEY,
  supabaseClient: supabase
})

export const dataProvider = {
  ...baseDataProvider,

  // Override getList for profiles to handle status filtering 
  getList: async (resource: string, params: any) => {
    if (resource === "profiles") {
      console.log("📋 Using simplified profiles list (no RPC)")
      
      // Remove status filters since base provider can't handle them
      const cleanParams = {
        ...params,
        filter: {
          ...params.filter,
          status: undefined,
          account_status: undefined
        },
        sort: params.sort?.field === 'status' || params.sort?.field === 'account_status' 
          ? { field: 'created_at', order: 'DESC' }
          : params.sort
      }
      
      const result = await baseDataProvider.getList(resource, cleanParams)
      
      // Add dummy account_status and gender_value for compatibility
      const enrichedData = result.data.map((record: any) => ({
        ...record,
        account_status: 'active',  // Default value
        gender_value: 'unknown'    // Default value
      }))
      
      return {
        ...result,
        data: enrichedData
      }
    }

    // For other resources, use base provider
    return baseDataProvider.getList(resource, params)
  }
}