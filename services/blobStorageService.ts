import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Supabase Configuration ---
// These environment variables must be configured in your Vercel project.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Initialize the Supabase client.
// The application will fail to initialize if the environment variables are not set.
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = 'user-data';

const getFilePath = (userId: string, key: string): string => {
  // Use a consistent file extension for JSON data.
  return `${userId}/${key}.json`;
};

/**
 * Fetches data from Supabase Storage.
 * @param userId - The ID of the current user.
 * @param key - The key for the data (e.g., 'jobs', 'clients').
 * @returns The parsed data or null if not found or on error.
 */
export const get = async <T>(userId: string, key: string): Promise<T | null> => {
  try {
    const filePath = getFilePath(userId, key);
    const { data: blob, error } = await supabase.storage.from(BUCKET_NAME).download(filePath);

    if (error) {
      // "The resource was not found" is an expected error if the file doesn't exist yet.
      if (error.message === 'The resource was not found') {
        return null;
      }
      throw error;
    }

    if (blob) {
      const text = await blob.text();
      return JSON.parse(text) as T;
    }
    return null;
  } catch (error) {
    console.error(`[SupabaseService] Error getting data for key ${key} and user ${userId}:`, error);
    return null;
  }
};

/**
 * Uploads/sets data in Supabase Storage.
 * @param userId - The ID of the current user.
 * @param key - The key for the data.
 * @param data - The data to store.
 */
export const set = async (userId: string, key: string, data: unknown): Promise<void> => {
  try {
    const filePath = getFilePath(userId, key);
    const jsonString = JSON.stringify(data);
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, jsonString, {
        contentType: 'application/json;charset=UTF-8',
        upsert: true, // This will overwrite the file if it already exists
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`[SupabaseService] Error setting data for key ${key} and user ${userId}:`, error);
    throw error;
  }
};

/**
 * Deletes data from Supabase Storage.
 * @param userId - The ID of the current user.
 * @param key - The key of the data to delete.
 */
export const del = async (userId: string, key: string): Promise<void> => {
  try {
    const filePath = getFilePath(userId, key);
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`[SupabaseService] Error deleting data for key ${key} and user ${userId}:`, error);
  }
};
