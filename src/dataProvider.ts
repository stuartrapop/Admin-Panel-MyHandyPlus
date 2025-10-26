import { supabaseDataProvider } from "ra-supabase";
import { GetListParams } from "react-admin";
import { supabase } from "./supabaseClient";

// Type for RPC function response
interface SearchProfilesResult {
  id: string;
  firstname?: string;
  name?: string;
  birthdate?: string;
  bio?: string;
  profession?: string;
  declared_country?: string;
  declared_city?: string;
  declared_location?: unknown;
  location_verified?: boolean;
  created_at: string;
  updated_at: string;
  email?: string;
  account_status?: string;
  gender_value?: string;
  total_count: number;
}

const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_API_KEY,
  supabaseClient: supabase,
});

export const dataProvider = {
  ...baseDataProvider,

  // Override getList for profiles to use RPC function for comprehensive filtering
  getList: async (resource: string, params: GetListParams) => {
    if (resource === 'profiles') {
      const page = params.pagination?.page || 1;
      const perPage = params.pagination?.perPage || 10;
      const field = params.sort?.field || 'created_at';
      const order = params.sort?.order || 'DESC';
      const filters = params.filter || {};

      // Calculate offset for pagination
      const offset = (page - 1) * perPage;

      try {
        // Call the RPC function with all filters
        console.log('🔍 Calling search_profiles RPC with filters:', {
          search_firstname: filters.firstname || null,
          search_name: filters.name || null,
          search_email: filters.email || null,
          filter_gender: filters.gender || null,
          filter_status: filters.status || null,
          sort_field: field,
          sort_order: order,
          page_limit: perPage,
          page_offset: offset,
        });

        const { data, error } = await supabase.rpc('search_profiles', {
          search_firstname: filters.firstname || null,
          search_name: filters.name || null,
          search_email: filters.email || null,
          filter_gender: filters.gender || null,
          filter_status: filters.status || null,
          sort_field: field,
          sort_order: order,
          page_limit: perPage,
          page_offset: offset,
        });

        if (error) {
          console.error('❌ Error calling search_profiles RPC:', error);
          throw error;
        }

        console.log('✅ RPC returned:', data?.length, 'records');
        if (data && data.length > 0) {
          console.log('📊 Sample record:', data[0]);
        }

        // Extract total count from first record (all records have same total_count)
        const total = data && data.length > 0 ? data[0].total_count : 0;

        // Remove total_count from individual records as it's not a profile field
        const cleanData = data?.map((record: SearchProfilesResult) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { total_count, ...profile } = record;
          return profile;
        }) || [];

        return {
          data: cleanData,
          total: Number(total),
        };
      } catch (error) {
        console.error('RPC function error:', error);
        // Fallback to base provider if RPC fails
        console.warn('Falling back to base data provider');
        return baseDataProvider.getList(resource, params);
      }
    }

    // For other resources, use base provider
    return baseDataProvider.getList(resource, params);
  },
};
