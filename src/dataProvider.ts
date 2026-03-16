import { supabaseDataProvider } from "ra-supabase";
import { GetListParams, GetManyReferenceParams } from "react-admin";
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
  auth_providers?: string
  total_count: number
}

const baseDataProvider = supabaseDataProvider({
  instanceUrl: import.meta.env.VITE_SUPABASE_URL,
  apiKey: import.meta.env.VITE_SUPABASE_API_KEY,
  supabaseClient: supabase
})

// Create a logging wrapper for base data provider
const loggingBaseDataProvider = new Proxy(baseDataProvider, {
  get(target, prop) {
    const original = target[prop as keyof typeof target];
    if (typeof original === 'function') {
      return async (...args: unknown[]) => {
        console.log(`📞 baseDataProvider.${String(prop)} called with:`, args[0], args[1] ? args[1] : '');
        try {
          const result = await (original as (...args: unknown[]) => Promise<unknown>).apply(target, args);
          console.log(`✅ baseDataProvider.${String(prop)} returned:`, result);
          return result;
        } catch (error) {
          console.error(`❌ baseDataProvider.${String(prop)} error:`, error);
          throw error;
        }
      };
    }
    return original;
  }
});

async function fetchProfileById(id: string): Promise<SearchProfilesResult | null> {
  let currentOffset = 0
  const batchSize = 1000

  while (true) {
    const { data: rpcData, error } = await supabase.rpc("search_profiles", {
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

    if (error) throw error
    if (!rpcData || rpcData.length === 0) break

    const found = rpcData.find((p: SearchProfilesResult) => p.id === id)
    if (found) return found

    currentOffset += batchSize
  }

  return null
}

export const dataProvider = {
  ...loggingBaseDataProvider,

  // Override getList for profiles to use RPC function
  getList: async (resource: string, params: GetListParams) => {
    // Handle profile_attributes with composite key
    if (resource === 'chat_rooms') {
      const { page, perPage } = params.pagination || { page: 1, perPage: 100 };
      const { field, order } = params.sort || { field: 'last_message_at', order: 'DESC' };
      const filters = params.filter || {};

      const start = (page - 1) * perPage;
      const end = start + perPage - 1;

      let query = supabase
        .from('chat_rooms')
        .select('*', { count: 'exact' });

      if (filters.user_id) {
        query = query.or(`user1_id.eq.${filters.user_id},user2_id.eq.${filters.user_id}`);
      }

      query = query
        .order(field, { ascending: order === 'ASC' })
        .range(start, end);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ chat_rooms getList error:', error);
        throw error;
      }

      console.log('✅ chat_rooms getList:', data?.length, 'records');
      return { data: data || [], total: count || 0 };
    }

    if (resource === "profile_attributes") {
      console.log("🔥 getList called for profile_attributes", params);
      const result = await loggingBaseDataProvider.getList(resource, params);
      // Add synthetic id field from composite key
      if (result.data) {
        result.data = result.data.map((record: Record<string, unknown>) => ({
          ...record,
          id: `${record.profile_id}-${record.attribute_id}` // Composite key as id
        }));
      }
      console.log("✅ getList result for profile_attributes:", result.data.length, "records");
      return result;
    }

    if (resource === "profiles") {
      const page = params.pagination?.page || 1
      const perPage = params.pagination?.perPage || 10
      const field = params.sort?.field || "created_at"
      const order = params.sort?.order || "DESC"
      const filters = params.filter || {}

      // Calculate offset for pagination
      const offset = (page - 1) * perPage

      // UUID exact-match search: use the same RPC to get fully enriched data
      if (filters.uuid) {
        console.log("🔍 UUID filter detected, searching by ID:", filters.uuid)
        const profile = await fetchProfileById(filters.uuid)
        if (!profile) return { data: [], total: 0 }
        const { total_count, ...cleanProfile } = profile
        return { data: [cleanProfile], total: 1 }
      }

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

        const result = await loggingBaseDataProvider.getList(resource, fallbackParams)

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

    return loggingBaseDataProvider.getList(resource, params)
  },

  // Override getOne for profiles to use batch searching to find any profile
  getOne: async (resource: string, params: { id: string }) => {
    if (resource === "profiles") {
      try {
        console.log("🔍 Searching for profile:", params.id)

        const foundProfile = await fetchProfileById(params.id)

        if (!foundProfile) {
          throw new Error(`Profile ${params.id} not found`)
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { total_count, ...cleanProfile } = foundProfile

        console.log("✅ Profile loaded successfully:", { id: cleanProfile.id, email: cleanProfile.email })

        return {
          data: cleanProfile
        }
      } catch (error) {
        console.error("❌ Profile search failed, using base fallback:", error)

        // Fallback to base provider
        const result = await loggingBaseDataProvider.getOne(resource, params)

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

    return loggingBaseDataProvider.getOne(resource, params)
  },

  // Override getMany for profile_attributes to add synthetic id
  getMany: async (resource: string, params: { ids: string[] }) => {
    if (resource === "profile_attributes") {
      console.log("🔥 getMany called for profile_attributes", params);
      // Parse composite IDs back to profile_id and attribute_id pairs
      const idPairs = params.ids.map(id => {
        const [profile_id, attribute_id] = id.split('-');
        return { profile_id, attribute_id };
      });

      console.log("🔍 Parsed ID pairs:", idPairs);

      // Fetch each record manually
      const promises = idPairs.map(({ profile_id, attribute_id }) =>
        supabase
          .from('profile_attributes')
          .select('profile_id, attribute_id, created_at')
          .eq('profile_id', profile_id)
          .eq('attribute_id', attribute_id)
          .single()
      );

      const results = await Promise.all(promises);

      // Filter out errors and add synthetic id
      const data = results
        .filter(({ data, error }) => !error && data)
        .map(({ data }) => data ? ({
          ...data,
          id: `${data.profile_id}-${data.attribute_id}`
        }) : null)
        .filter(Boolean);

      console.log("✅ getMany result for profile_attributes:", data.length, "records");
      return { data };
    }
    return loggingBaseDataProvider.getMany(resource, params);
  },

  // Override getManyReference for profile_attributes to add synthetic id
  getManyReference: async (resource: string, params: GetManyReferenceParams) => {
    if (resource === "profile_attributes") {
      console.log("🔥 getManyReference called for profile_attributes", params);
      // Manually fetch profile_attributes without requiring 'id' column
      const { target, id, pagination, sort, filter } = params;
      const { page, perPage } = pagination;
      const { field, order } = sort;

      console.log(`🔍 Query params: target=${target}, id=${id}, field=${field}, order=${order}`);

      const query = supabase
        .from('profile_attributes')
        .select('profile_id, attribute_id, created_at', { count: 'exact' })
        .eq(target, id);

      // Apply filters
      if (filter) {
        console.log("🔍 Applying filters:", filter);
        Object.entries(filter).forEach(([key, value]) => {
          query.eq(key, value);
        });
      }

      // Map synthetic 'id' field to actual column for sorting
      // Since 'id' doesn't exist in the table, default to 'created_at'
      const sortField = field === 'id' ? 'created_at' : field;
      console.log(`🔍 Mapped sort field: ${field} -> ${sortField}`);

      // Apply sorting
      query.order(sortField, { ascending: order === 'ASC' });

      // Apply pagination
      const start = (page - 1) * perPage;
      const end = start + perPage - 1;
      query.range(start, end);

      console.log("🔍 Executing Supabase query...");
      const { data, error, count } = await query;

      if (error) {
        console.error("❌ getManyReference error:", error);
        throw error;
      }

      console.log("✅ Query successful, raw data:", data?.length, "records");

      // Add synthetic id field from composite key
      const dataWithId = (data || []).map((record) => ({
        ...record,
        id: `${record.profile_id}-${record.attribute_id}`
      }));

      console.log("✅ getManyReference result for profile_attributes:", dataWithId.length, "records, total:", count);

      return {
        data: dataWithId,
        total: count || 0
      };
    }
    console.log("🔥 getManyReference called for resource:", resource);
    return loggingBaseDataProvider.getManyReference(resource, params);
  }
}
