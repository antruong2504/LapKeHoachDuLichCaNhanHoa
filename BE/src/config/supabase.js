import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://jaxaasgspurslgsujlmh.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const uploadImageToSupabase = async (fileBuffer, fileName, mimeType, bucket = 'tripmate-media') => {
  try {
    const filePath = `uploads/${Date.now()}_${fileName}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('Supabase storage upload warning (fallback to local if bucket not created):', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Error uploading to Supabase Storage:', err);
    return null;
  }
};

export const uploadToSupabase = uploadImageToSupabase;
