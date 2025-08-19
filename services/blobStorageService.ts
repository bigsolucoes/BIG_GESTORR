import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- Supabase Configuration ---
// Vercel and other platforms require a specific prefix (like NEXT_PUBLIC_) to expose env vars to the browser.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
export let isPersistenceEnabled = false;

// Initialize Supabase only if the environment variables are set.
if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    isPersistenceEnabled = true;
    console.log("[SupabaseService] Persistence is enabled.");
  } catch (error) {
    console.error("[SupabaseService] Error initializing Supabase client:", error);
    isPersistenceEnabled = false;
  }
} else {
  console.warn("[SupabaseService] Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set. Data persistence will be disabled.");
  isPersistenceEnabled = false;
}


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
  if (!supabase || !isPersistenceEnabled) {
    return null;
  }
  
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
  if (!supabase || !isPersistenceEnabled) {
    return;
  }

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
  if (!supabase || !isPersistenceEnabled) {
    return;
  }

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