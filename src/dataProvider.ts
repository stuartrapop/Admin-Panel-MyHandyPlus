import { supabaseDataProvider } from "ra-supabase";
import { GetListParams } from "react-admin";
import { supabase } from "./supabaseClient";

// Type for RPC function response
interface SearchProfilesResult {
  id: string
  firstname?: string
  name?: string
  birthdate?: string
  bio?: string
  profession?: string
  declared_country?: string
  declared_city?: string
  declared_location?: unknown
  location_verified?: boolean
  created_at: string
  updated_at: string
  email?: string
  account_status?: string
  gender_value?: string
  profile_photo_url?: string
  total_count: number
}

const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_API_KEY,
  supabaseClient: supabase
})

export const dataProvider = {
  ...baseDataProvider,

  // Override getList for profiles to use RPC function
  getList: async (resource: string, params: GetListParams) => {
    if (resource === "profiles") {
      const page = params.pagination?.page || 1
      const perPage = params.pagination?.perPage || 10
      const field = params.sort?.field || "created_at"
      const order = params.sort?.order || "DESC"
      const filters = params.filter || {}

      // Calculate offset for pagination
      const offset = (page - 1) * perPage

      try {
        console.log("🔍 Calling search_profiles RPC...")

        const { data, error } = await supabase.rpc("search_profiles", {
          search_firstname: filters.firstname || null,
          search_name: filters.name || null,
          search_email: filters.email || null,
          filter_gender: filters.gender || null,
          filter_status: filters.status || null,
          sort_field: field,
          sort_order: order,
          page_limit: perPage,
          page_offset: offset
        })

        if (error) {
          console.error("❌ RPC Error:", error)
          throw error
        }

        console.log("✅ RPC Success:", data?.length, "records")
        console.log("🔍 RAW RPC DATA:", JSON.stringify(data, null, 2))

        // Log first record to see what we're getting
        if (data && data.length > 0) {
          console.log("📊 GENDER VALUE:", data[0].gender_value)
          console.log("📊 ACCOUNT STATUS:", data[0].account_status)
          console.log("📊 First record sample:", {
            id: data[0].id,
            firstname: data[0].firstname,
            gender_value: data[0].gender_value,
            account_status: data[0].account_status,
            profile_photo_url: data[0].profile_photo_url?.substring(0, 50) + "..."
          })
        }

        // Extract total count from first record
        const total = data && data.length > 0 ? data[0].total_count : 0

        // Remove total_count from records and clean up the data
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const cleanData = data?.map(({ total_count, ...profile }: SearchProfilesResult) => profile) || []

        console.log("🧹 Clean data sample:", cleanData[0])

        return {
          data: cleanData,
          total: Number(total)
        }
      } catch (error) {
        console.error("❌ RPC failed, using fallback:", error)

        // Fallback to base provider - only search by firstname/name (profiles table fields)
        const fallbackParams: GetListParams = {
          ...params,
          filter: {
            // Only use firstname and name which exist in profiles table
            ...(filters.firstname && { firstname: filters.firstname }),
            ...(filters.name && { name: filters.name })
            // Remove email, status, and gender filters as they require joins
          },
          sort: field === 'account_status' || field === 'status' || field === 'email'
            ? { field: 'created_at', order: 'DESC' as const }
            : params.sort
        }

        const result = await baseDataProvider.getList(resource, fallbackParams)

        // Add missing fields for React-Admin compatibility
        const enrichedData = result.data.map((record) => ({
          ...record,
          email: null, // Email not available without RPC
          account_status: 'active',
          gender_value: 'unknown',
          profile_photo_url: null // Photo URL not available without RPC
        }))

        return {
          ...result,
          data: enrichedData
        }
      }
    }

    return baseDataProvider.getList(resource, params)
  },

  // Override getOne for profiles to use batch searching to find any profile
  getOne: async (resource: string, params: { id: string }) => {
    if (resource === "profiles") {
      try {
        console.log("🔍 Searching for profile across all records:", params.id)

        // Search through all records in batches until we find the profile
        let foundProfile = null
        let currentOffset = 0
        const batchSize = 1000

        while (!foundProfile) {
          const { data: rpcData, error: rpcError } = await supabase.rpc("search_profiles", {
            search_firstname: null,
            search_name: null,
            search_email: null,
            filter_gender: null,
            filter_status: null,
            sort_field: "created_at",
            sort_order: "DESC",
            page_limit: batchSize,
            page_offset: currentOffset
          })

          if (rpcError) {
            console.error("❌ RPC Error in getOne:", rpcError)
            throw rpcError
          }

          if (!rpcData || rpcData.length === 0) {
            // No more records to search
            console.log("🔍 No more records found, profile not found")
            break
          }

          // Find the profile in this batch
          foundProfile = rpcData.find((p: SearchProfilesResult) => p.id === params.id)

          if (foundProfile) {
            console.log(`✅ Profile found in batch starting at offset ${currentOffset}`)
            break
          }

          // Move to next batch
          currentOffset += batchSize
          console.log(`🔍 Profile not found in batch ${currentOffset - batchSize}-${currentOffset}, searching next batch...`)
        }

        if (!foundProfile) {
          throw new Error(`Profile ${params.id} not found in any batch`)
        }

        // Remove total_count from the profile
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { total_count, ...cleanProfile } = foundProfile

        console.log("✅ Profile loaded successfully:", { id: cleanProfile.id, email: cleanProfile.email })

        return {
          data: cleanProfile
        }
      } catch (error) {
        console.error("❌ Profile search failed, using base fallback:", error)

        // Fallback to base provider
        const result = await baseDataProvider.getOne(resource, params)

        // Add missing fields
        return {
          data: {
            ...result.data,
            email: null,
            account_status: 'active',
            gender_value: 'unknown',
            profile_photo_url: null
          }
        }
      }
    }

    return baseDataProvider.getOne(resource, params)
  }
}
