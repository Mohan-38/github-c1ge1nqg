import { supabase } from '../lib/supabase';

// File validation
export interface FileValidation {
  valid: boolean;
  error?: string;
}

export const validateFile = (file: File): FileValidation => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported. Please use PDF, DOC, PPT, or XLS files.' };
  }

  return { valid: true };
};

// Upload file to Supabase Storage
export const uploadFile = async (
  file: File,
  path: string
): Promise<{
  url: string;
  path: string;
  size: number;
}> => {
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split('.').pop();
  const fileName = `${timestamp}_${randomString}.${fileExtension}`;
  const fullPath = `${path}/${fileName}`;

  try {
    const { data, error } = await supabase.storage
      .from('project-documents')
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-documents')
      .getPublicUrl(fullPath);

    return {
      url: urlData.publicUrl,
      path: fullPath,
      size: file.size
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

// Delete file from Supabase Storage
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from('project-documents')
      .remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  } catch (error) {
    console.error('File delete error:', error);
    throw error;
  }
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file info from URL
export const getFileInfo = async (url: string): Promise<{
  exists: boolean;
  size?: number;
  type?: string;
}> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    
    if (!response.ok) {
      return { exists: false };
    }

    const size = response.headers.get('content-length');
    const type = response.headers.get('content-type');

    return {
      exists: true,
      size: size ? parseInt(size, 10) : undefined,
      type: type || undefined
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return { exists: false };
  }
};