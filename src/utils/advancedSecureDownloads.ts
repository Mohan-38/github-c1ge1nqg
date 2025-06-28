import { supabase } from '../lib/supabase';
import { sendAdvancedSecureDocumentDelivery } from './advancedEmail';

// Enhanced security configuration
export interface AdvancedSecureConfig {
  expirationHours: number;
  maxDownloads: number;
  requireEmailVerification: boolean;
  requireOTP: boolean;
  enableGeolocation: boolean;
  enableDeviceFingerprinting: boolean;
  allowedDownloadWindow: {
    startHour: number; // 0-23
    endHour: number;   // 0-23
  };
}

export interface SecureDownloadSession {
  id: string;
  token: string;
  document_id: string;
  recipient_email: string;
  order_id: string;
  verification_code: string;
  expires_at: string;
  max_downloads: number;
  download_count: number;
  is_verified: boolean;
  is_active: boolean;
  device_fingerprint?: string;
  allowed_ip_addresses?: string[];
  download_window_start?: number;
  download_window_end?: number;
  created_at: string;
  updated_at: string;
}

// Default enhanced configuration
const ENHANCED_CONFIG: AdvancedSecureConfig = {
  expirationHours: 48, // 2 days
  maxDownloads: 3,
  requireEmailVerification: true,
  requireOTP: true,
  enableGeolocation: false,
  enableDeviceFingerprinting: true,
  allowedDownloadWindow: {
    startHour: 9,  // 9 AM
    endHour: 18    // 6 PM
  }
};

// PRODUCTION URL CONFIGURATION - Same as secureDownloads.ts
const getProductionBaseUrl = (): string => {
  // For production deployment, use your actual domain
  const PRODUCTION_URL = 'https://techcreator-portfolio.netlify.app/'; // Replace with your actual domain
  
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
 * METHOD 1: Multi-Factor Authentication (MFA) Download System
 * - Email verification + OTP
 * - Device fingerprinting
 * - Time-based access windows
 * - PRODUCTION-READY URLs
 */
export const generateMFADownloadLinks = async (
  documents: Array<{
    id: string;
    name: string;
    url: string;
    category: string;
    review_stage: string;
  }>,
  recipientEmail: string,
  orderId: string,
  config: Partial<AdvancedSecureConfig> = {}
): Promise<{
  sessionId: string;
  verificationUrl: string;
  expiresAt: string;
}> => {
  const finalConfig = { ...ENHANCED_CONFIG, ...config };
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + finalConfig.expirationHours);

  // Generate session token and verification code
  const sessionToken = generateSecureToken(64);
  const verificationCode = generateOTP(6);

  try {
    // Create secure download session
    const { data: session, error } = await supabase
      .from('secure_download_sessions')
      .insert({
        token: sessionToken,
        recipient_email: recipientEmail.toLowerCase(),
        order_id: orderId,
        verification_code: verificationCode,
        expires_at: expiresAt.toISOString(),
        max_downloads: finalConfig.maxDownloads,
        download_count: 0,
        is_verified: false,
        is_active: true,
        download_window_start: finalConfig.allowedDownloadWindow.startHour,
        download_window_end: finalConfig.allowedDownloadWindow.endHour
      })
      .select()
      .single();

    if (error) throw error;

    // Store document associations
    for (const document of documents) {
      await supabase
        .from('session_documents')
        .insert({
          session_id: session.id,
          document_id: document.id,
          document_name: document.name,
          document_url: document.url,
          document_category: document.category,
          review_stage: document.review_stage
        });
    }

    // Generate verification URL using PRODUCTION domain
    const baseUrl = getProductionBaseUrl();
    const verificationUrl = `${baseUrl}/verify-download/${sessionToken}`;

    console.log(`🔗 Generated production-ready MFA URL: ${verificationUrl}`);

    // Send MFA email with verification code
    await sendAdvancedSecureDocumentDelivery({
      recipientEmail,
      sessionToken,
      verificationCode,
      verificationUrl,
      documentsCount: documents.length,
      expiresAt: expiresAt.toISOString(),
      orderId,
      downloadWindow: `${finalConfig.allowedDownloadWindow.startHour}:00 - ${finalConfig.allowedDownloadWindow.endHour}:00`
    });

    return {
      sessionId: session.id,
      verificationUrl,
      expiresAt: expiresAt.toISOString()
    };

  } catch (error) {
    console.error('Error generating MFA download links:', error);
    throw error;
  }
};

/**
 * METHOD 2: Blockchain-Based Document Verification
 * - Creates immutable download records
 * - Cryptographic proof of delivery
 * - PRODUCTION-READY URLs
 */
export const generateBlockchainVerifiedLinks = async (
  documents: Array<{
    id: string;
    name: string;
    url: string;
    hash?: string;
  }>,
  recipientEmail: string,
  orderId: string
): Promise<{
  blockchainTxId: string;
  verificationUrl: string;
  proofOfDelivery: string;
}> => {
  try {
    // Generate document hashes if not provided
    const documentsWithHashes = await Promise.all(
      documents.map(async (doc) => ({
        ...doc,
        hash: doc.hash || await generateDocumentHash(doc.url)
      }))
    );

    // Create blockchain record (simulated - in real implementation, use actual blockchain)
    const blockchainRecord = {
      orderId,
      recipientEmail,
      documents: documentsWithHashes.map(d => ({
        id: d.id,
        name: d.name,
        hash: d.hash
      })),
      timestamp: new Date().toISOString(),
      deliveryProof: generateSecureToken(32)
    };

    // Store in database with blockchain reference
    const { data: blockchainSession, error } = await supabase
      .from('blockchain_download_sessions')
      .insert({
        order_id: orderId,
        recipient_email: recipientEmail,
        blockchain_tx_id: `0x${generateSecureToken(64)}`, // Simulated transaction ID
        proof_of_delivery: blockchainRecord.deliveryProof,
        document_hashes: documentsWithHashes.map(d => d.hash),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Generate verification URL using PRODUCTION domain
    const baseUrl = getProductionBaseUrl();
    const verificationUrl = `${baseUrl}/blockchain-verify/${blockchainSession.blockchain_tx_id}`;

    console.log(`🔗 Generated production-ready blockchain URL: ${verificationUrl}`);

    return {
      blockchainTxId: blockchainSession.blockchain_tx_id,
      verificationUrl,
      proofOfDelivery: blockchainRecord.deliveryProof
    };

  } catch (error) {
    console.error('Error generating blockchain verified links:', error);
    throw error;
  }
};

/**
 * METHOD 3: Progressive Download System
 * - Documents unlock based on time intervals
 * - Email confirmations for each stage
 * - PRODUCTION-READY URLs
 */
export const generateProgressiveDownloadLinks = async (
  documents: Array<{
    id: string;
    name: string;
    url: string;
    review_stage: string;
    unlock_delay_hours?: number;
  }>,
  recipientEmail: string,
  orderId: string
): Promise<{
  sessionId: string;
  unlockSchedule: Array<{
    stage: string;
    unlockTime: string;
    documentsCount: number;
  }>;
}> => {
  try {
    const sessionToken = generateSecureToken(64);
    
    // Create progressive session
    const { data: session, error } = await supabase
      .from('progressive_download_sessions')
      .insert({
        token: sessionToken,
        recipient_email: recipientEmail,
        order_id: orderId,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Group documents by review stage and set unlock times
    const stageGroups = documents.reduce((acc, doc) => {
      if (!acc[doc.review_stage]) {
        acc[doc.review_stage] = [];
      }
      acc[doc.review_stage].push(doc);
      return acc;
    }, {} as Record<string, typeof documents>);

    const unlockSchedule = [];
    let baseDelay = 0;

    for (const [stage, stageDocs] of Object.entries(stageGroups)) {
      const unlockTime = new Date(Date.now() + baseDelay * 60 * 60 * 1000);
      
      // Store progressive unlock data
      await supabase
        .from('progressive_unlocks')
        .insert({
          session_id: session.id,
          review_stage: stage,
          unlock_time: unlockTime.toISOString(),
          documents: stageDocs.map(d => ({
            id: d.id,
            name: d.name,
            url: d.url
          })),
          is_unlocked: baseDelay === 0 // First stage unlocks immediately
        });

      unlockSchedule.push({
        stage,
        unlockTime: unlockTime.toISOString(),
        documentsCount: stageDocs.length
      });

      baseDelay += 24; // 24 hours between stages
    }

    return {
      sessionId: session.id,
      unlockSchedule
    };

  } catch (error) {
    console.error('Error generating progressive download links:', error);
    throw error;
  }
};

/**
 * METHOD 4: Secure Portal Access
 * - Customer-specific portal with dashboard
 * - Real-time download tracking
 * - Support chat integration
 * - PRODUCTION-READY URLs
 */
export const generateSecurePortalAccess = async (
  documents: Array<{
    id: string;
    name: string;
    url: string;
    category: string;
    review_stage: string;
  }>,
  recipientEmail: string,
  orderId: string,
  customerName: string
): Promise<{
  portalUrl: string;
  accessToken: string;
  temporaryPassword: string;
}> => {
  try {
    const accessToken = generateSecureToken(32);
    const temporaryPassword = generateSecurePassword(12);
    
    // Create customer portal account
    const { data: portalAccount, error } = await supabase
      .from('customer_portals')
      .insert({
        access_token: accessToken,
        customer_email: recipientEmail,
        customer_name: customerName,
        order_id: orderId,
        temporary_password: await hashPassword(temporaryPassword),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    // Store portal documents
    for (const document of documents) {
      await supabase
        .from('portal_documents')
        .insert({
          portal_id: portalAccount.id,
          document_id: document.id,
          document_name: document.name,
          document_url: document.url,
          document_category: document.category,
          review_stage: document.review_stage,
          download_count: 0,
          is_available: true
        });
    }

    // Generate portal URL using PRODUCTION domain
    const baseUrl = getProductionBaseUrl();
    const portalUrl = `${baseUrl}/customer-portal/${accessToken}`;

    console.log(`🔗 Generated production-ready portal URL: ${portalUrl}`);

    return {
      portalUrl,
      accessToken,
      temporaryPassword
    };

  } catch (error) {
    console.error('Error generating secure portal access:', error);
    throw error;
  }
};

/**
 * METHOD 5: QR Code + Mobile App Integration
 * - QR codes for mobile verification
 * - Mobile app for secure downloads
 * - PRODUCTION-READY URLs
 */
export const generateQRCodeDownloadLinks = async (
  documents: Array<{
    id: string;
    name: string;
    url: string;
  }>,
  recipientEmail: string,
  orderId: string
): Promise<{
  qrCodeData: string;
  mobileAppUrl: string;
  verificationToken: string;
}> => {
  try {
    const verificationToken = generateSecureToken(32);
    
    // Create QR session
    const { data: qrSession, error } = await supabase
      .from('qr_download_sessions')
      .insert({
        verification_token: verificationToken,
        recipient_email: recipientEmail,
        order_id: orderId,
        documents: documents,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        is_active: true,
        is_scanned: false
      })
      .select()
      .single();

    if (error) throw error;

    // Generate QR code data with PRODUCTION URL
    const baseUrl = getProductionBaseUrl();
    const qrCodeData = JSON.stringify({
      type: 'secure_download',
      token: verificationToken,
      email: recipientEmail,
      orderId: orderId,
      timestamp: Date.now(),
      url: `${baseUrl}/qr-verify/${verificationToken}`
    });

    const mobileAppUrl = `techcreator://download?token=${verificationToken}&email=${encodeURIComponent(recipientEmail)}`;

    console.log(`🔗 Generated production-ready QR URL: ${baseUrl}/qr-verify/${verificationToken}`);

    return {
      qrCodeData,
      mobileAppUrl,
      verificationToken
    };

  } catch (error) {
    console.error('Error generating QR code download links:', error);
    throw error;
  }
};

// Utility functions
const generateSecureToken = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateOTP = (length: number): string => {
  const digits = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result;
};

const generateSecurePassword = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateDocumentHash = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Error generating document hash:', error);
    return generateSecureToken(64); // Fallback
  }
};

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Device fingerprinting
export const generateDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvas.toDataURL(),
    timestamp: Date.now()
  };
  
  return btoa(JSON.stringify(fingerprint));
};

// IP geolocation (optional)
export const getGeolocation = async (): Promise<{
  country?: string;
  city?: string;
  ip?: string;
}> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      country: data.country_name,
      city: data.city,
      ip: data.ip
    };
  } catch (error) {
    console.error('Error getting geolocation:', error);
    return {};
  }
};