import { supabase } from '../lib/supabase';

// Types for secure downloads
export interface SecureDownloadToken {
  id: string;
  token: string;
  document_id: string;
  recipient_email: string;
  order_id: string;
  expires_at: string;
  max_downloads: number;
  download_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DownloadAttempt {
  id: string;
  token_id: string;
  attempted_email: string;
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  failure_reason?: string;
  attempted_at: string;
}

export interface SecureDownloadConfig {
  expirationHours: number;
  maxDownloads: number;
  requireEmailVerification: boolean;
}

// Default configuration
const DEFAULT_CONFIG: SecureDownloadConfig = {
  expirationHours: 72, // 3 days
  maxDownloads: 5,
  requireEmailVerification: true
};

// PRODUCTION URL CONFIGURATION
const getProductionBaseUrl = (): string => {
  // For production deployment, use your actual domain
  // This should be your deployed website URL (e.g., Netlify, Vercel, etc.)
  const PRODUCTION_URL = 'https://techcreator-portfolio.netlify.app'; // Replace with your actual domain
  
  // Check if we're in development or production
  if (typeof window !== 'undefined') {
    const currentHost = window.location.host;
    
    // If running on localhost or webcontainer, use production URL for secure links
    if (currentHost.includes('localhost') || 
        currentHost.includes('webcontainer') || 
        currentHost.includes('local-credentialless')) {
      return PRODUCTION_URL;
    }
    
    // If already on production domain, use current origin
    return window.location.origin;
  }
  
  // Fallback to production URL
  return PRODUCTION_URL;
};

/**
 * Generate secure download tokens for documents
 * These links will work independently of local development server
 */
export const generateSecureDownloadTokens = async (
  documents: Array<{
    id: string;
    name: string;
    url: string;
  }>,
  recipientEmail: string,
  orderId: string,
  config: Partial<SecureDownloadConfig> = {}
): Promise<Array<{
  documentId: string;
  documentName: string;
  secureUrl: string;
  expiresAt: string;
}>> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + finalConfig.expirationHours);

  const secureUrls: Array<{
    documentId: string;
    documentName: string;
    secureUrl: string;
    expiresAt: string;
  }> = [];

  for (const document of documents) {
    try {
      // Generate secure token
      const token = generateSecureToken(64);

      // Store token in database
      const { data: storedToken, error: storeError } = await supabase
        .from('secure_download_tokens')
        .insert({
          token,
          document_id: document.id,
          recipient_email: recipientEmail.toLowerCase(),
          order_id: orderId,
          expires_at: expiresAt.toISOString(),
          max_downloads: finalConfig.maxDownloads,
          download_count: 0,
          is_active: true
        })
        .select()
        .single();

      if (storeError) {
        console.error('Error storing token:', storeError);
        continue;
      }

      // Generate secure URL using PRODUCTION domain
      const baseUrl = getProductionBaseUrl();
      const secureUrl = `${baseUrl}/secure-download/${token}?email=${encodeURIComponent(recipientEmail)}`;

      console.log(`🔗 Generated production-ready secure URL: ${secureUrl}`);

      secureUrls.push({
        documentId: document.id,
        documentName: document.name,
        secureUrl,
        expiresAt: expiresAt.toISOString()
      });

    } catch (error) {
      console.error('Error generating secure URL for document:', document.id, error);
    }
  }

  return secureUrls;
};

/**
 * Verify and validate download token
 * This works independently of local server
 */
export const verifyDownloadToken = async (
  token: string,
  attemptedEmail: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{
  valid: boolean;
  document?: any;
  reason?: string;
  tokenData?: SecureDownloadToken;
}> => {
  try {
    console.log('🔍 Verifying download token:', token);
    console.log('📧 For email:', attemptedEmail);

    // Get token data with document information
    const { data: tokenData, error: tokenError } = await supabase
      .from('secure_download_tokens')
      .select(`
        *,
        project_documents (
          id,
          name,
          url,
          type,
          size,
          document_category,
          review_stage
        )
      `)
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (tokenError || !tokenData) {
      console.error('❌ Token not found or error:', tokenError);
      await logDownloadAttempt(null, attemptedEmail, false, 'Invalid or expired token', ipAddress, userAgent);
      return { valid: false, reason: 'Invalid or expired token' };
    }

    console.log('✅ Token found in database');

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    if (now > expiresAt) {
      console.log('⏰ Token expired:', expiresAt);
      await logDownloadAttempt(tokenData.id, attemptedEmail, false, 'Token expired', ipAddress, userAgent);
      
      // Deactivate expired token
      await supabase
        .from('secure_download_tokens')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', tokenData.id);

      return { valid: false, reason: 'Download link has expired. Please contact support for new links.' };
    }

    // Check email match (case insensitive)
    if (tokenData.recipient_email.toLowerCase() !== attemptedEmail.toLowerCase()) {
      console.log('📧 Email mismatch:', tokenData.recipient_email, 'vs', attemptedEmail);
      await logDownloadAttempt(tokenData.id, attemptedEmail, false, 'Email mismatch', ipAddress, userAgent);
      return { valid: false, reason: 'This download link is not authorized for your email address' };
    }

    // Check download count
    if (tokenData.download_count >= tokenData.max_downloads) {
      console.log('📊 Download limit exceeded:', tokenData.download_count, '>=', tokenData.max_downloads);
      await logDownloadAttempt(tokenData.id, attemptedEmail, false, 'Download limit exceeded', ipAddress, userAgent);
      return { valid: false, reason: 'Download limit exceeded for this link. Please contact support if you need additional downloads.' };
    }

    console.log('✅ Token validation successful');

    // Valid token - log successful attempt
    await logDownloadAttempt(tokenData.id, attemptedEmail, true, null, ipAddress, userAgent);

    // Increment download count
    await supabase
      .from('secure_download_tokens')
      .update({ 
        download_count: tokenData.download_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenData.id);

    return {
      valid: true,
      document: tokenData.project_documents,
      tokenData
    };

  } catch (error) {
    console.error('❌ Error verifying download token:', error);
    await logDownloadAttempt(null, attemptedEmail, false, 'System error', ipAddress, userAgent);
    return { valid: false, reason: 'System error occurred. Please try again or contact support.' };
  }
};

/**
 * Log download attempt for audit trail
 */
const logDownloadAttempt = async (
  tokenId: string | null,
  attemptedEmail: string,
  success: boolean,
  failureReason?: string | null,
  ipAddress?: string,
  userAgent?: string
): Promise<void> => {
  try {
    await supabase
      .from('download_attempts')
      .insert({
        token_id: tokenId,
        attempted_email: attemptedEmail.toLowerCase(),
        ip_address: ipAddress,
        user_agent: userAgent,
        success,
        failure_reason: failureReason,
        attempted_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging download attempt:', error);
  }
};

/**
 * Generate secure token
 */
const generateSecureToken = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Get client IP address (best effort)
 */
export const getClientIP = async (): Promise<string | undefined> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting client IP:', error);
    return undefined;
  }
};

/**
 * Revoke download token
 */
export const revokeDownloadToken = async (tokenId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('secure_download_tokens')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId);

    return !error;
  } catch (error) {
    console.error('Error revoking token:', error);
    return false;
  }
};

/**
 * Get download statistics for admin
 */
export const getDownloadStatistics = async (orderId?: string): Promise<{
  totalTokens: number;
  activeTokens: number;
  expiredTokens: number;
  totalAttempts: number;
  successfulDownloads: number;
  failedAttempts: number;
}> => {
  try {
    let tokensQuery = supabase.from('secure_download_tokens').select('*');
    let attemptsQuery = supabase.from('download_attempts').select('*');

    if (orderId) {
      tokensQuery = tokensQuery.eq('order_id', orderId);
      
      // Get token IDs for this order to filter attempts
      const { data: orderTokens } = await supabase
        .from('secure_download_tokens')
        .select('id')
        .eq('order_id', orderId);
      
      if (orderTokens && orderTokens.length > 0) {
        const tokenIds = orderTokens.map(t => t.id);
        attemptsQuery = attemptsQuery.in('token_id', tokenIds);
      }
    }

    const [tokensResult, attemptsResult] = await Promise.all([
      tokensQuery,
      attemptsQuery
    ]);

    const tokens = tokensResult.data || [];
    const attempts = attemptsResult.data || [];

    const now = new Date();
    const activeTokens = tokens.filter(t => t.is_active && new Date(t.expires_at) > now);
    const expiredTokens = tokens.filter(t => !t.is_active || new Date(t.expires_at) <= now);
    const successfulDownloads = attempts.filter(a => a.success);
    const failedAttempts = attempts.filter(a => !a.success);

    return {
      totalTokens: tokens.length,
      activeTokens: activeTokens.length,
      expiredTokens: expiredTokens.length,
      totalAttempts: attempts.length,
      successfulDownloads: successfulDownloads.length,
      failedAttempts: failedAttempts.length
    };

  } catch (error) {
    console.error('Error getting download statistics:', error);
    return {
      totalTokens: 0,
      activeTokens: 0,
      expiredTokens: 0,
      totalAttempts: 0,
      successfulDownloads: 0,
      failedAttempts: 0
    };
  }
};

/**
 * Cleanup expired tokens (admin function)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  try {
    const { data: expiredTokens, error } = await supabase
      .from('secure_download_tokens')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true)
      .select('id');
    
    if (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }

    return expiredTokens?.length || 0;
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return 0;
  }
};

/**
 * Request new download links (for expired tokens)
 */
export const requestNewDownloadLinks = async (
  orderId: string,
  recipientEmail: string
): Promise<boolean> => {
  try {
    // This would typically send an email to the admin or trigger a workflow
    // For now, we'll log the request
    console.log('New download links requested:', { orderId, recipientEmail });
    
    // In a real implementation, you might:
    // 1. Send an email to admin
    // 2. Create a support ticket
    // 3. Automatically regenerate links if within a certain timeframe
    
    return true;
  } catch (error) {
    console.error('Error requesting new download links:', error);
    return false;
  }
};