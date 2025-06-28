// Advanced email templates for enhanced security methods

interface AdvancedSecureEmailData {
  recipientEmail: string;
  sessionToken: string;
  verificationCode: string;
  verificationUrl: string;
  documentsCount: number;
  expiresAt: string;
  orderId: string;
  downloadWindow: string;
}

interface BlockchainEmailData {
  recipientEmail: string;
  blockchainTxId: string;
  verificationUrl: string;
  proofOfDelivery: string;
  documentsCount: number;
  orderId: string;
}

interface ProgressiveEmailData {
  recipientEmail: string;
  customerName: string;
  unlockSchedule: Array<{
    stage: string;
    unlockTime: string;
    documentsCount: number;
  }>;
  orderId: string;
}

interface PortalEmailData {
  recipientEmail: string;
  customerName: string;
  portalUrl: string;
  temporaryPassword: string;
  orderId: string;
  documentsCount: number;
}

interface QRCodeEmailData {
  recipientEmail: string;
  customerName: string;
  qrCodeData: string;
  mobileAppUrl: string;
  orderId: string;
  documentsCount: number;
}

// Import the existing email configuration
import { sendBrevoEmail, BrevoEmailData, CONFIG } from './email';

/**
 * METHOD 1: Multi-Factor Authentication Email
 */
export const sendAdvancedSecureDocumentDelivery = async (data: AdvancedSecureEmailData): Promise<void> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🔐 Secure Document Access - Multi-Factor Authentication</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
        .verification-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .verification-code { font-size: 32px; font-weight: bold; color: #d97706; letter-spacing: 8px; margin: 10px 0; }
        .security-notice { background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .step-box { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 6px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Secure Document Access</h1>
          <p>Multi-Factor Authentication Required</p>
        </div>
        
        <div class="content">
          <h2>Document Access Verification</h2>
          
          <p>Your secure documents are ready for download. For enhanced security, we require multi-factor authentication.</p>
          
          <div class="verification-box">
            <h3 style="color: #d97706; margin-top: 0;">📱 Your Verification Code</h3>
            <div class="verification-code">${data.verificationCode}</div>
            <p style="margin: 0; color: #92400e;">Enter this code when prompted</p>
          </div>
          
          <div class="security-notice">
            <h3 style="color: #dc2626; margin-top: 0;">🚨 Security Information</h3>
            <ul style="margin: 0; color: #991b1b;">
              <li><strong>Documents:</strong> ${data.documentsCount} files available</li>
              <li><strong>Access Window:</strong> ${data.downloadWindow} daily</li>
              <li><strong>Expires:</strong> ${new Date(data.expiresAt).toLocaleString()}</li>
              <li><strong>Order ID:</strong> ${data.orderId}</li>
            </ul>
          </div>
          
          <h3>🔑 Access Steps:</h3>
          
          <div class="step-box">
            <strong>Step 1:</strong> Click the secure verification link below
          </div>
          
          <div class="step-box">
            <strong>Step 2:</strong> Enter your email address for verification
          </div>
          
          <div class="step-box">
            <strong>Step 3:</strong> Enter the 6-digit verification code: <strong>${data.verificationCode}</strong>
          </div>
          
          <div class="step-box">
            <strong>Step 4:</strong> Complete device verification (if prompted)
          </div>
          
          <div class="step-box">
            <strong>Step 5:</strong> Access your secure document dashboard
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" 
               style="display: inline-block; padding: 15px 30px; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🔐 Begin Secure Verification
            </a>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">🛡️ Enhanced Security Features</h3>
            <ul style="margin: 0; color: #6b7280;">
              <li>Multi-factor authentication with email + OTP</li>
              <li>Device fingerprinting for additional security</li>
              <li>Time-restricted access windows</li>
              <li>Download attempt monitoring and logging</li>
              <li>Automatic session expiration</li>
            </ul>
          </div>
          
          <p><strong>Need Help?</strong> Contact support at <a href="mailto:${CONFIG.developerEmail}">${CONFIG.developerEmail}</a></p>
        </div>
        
        <div class="footer">
          <p>&copy; 2025 TechCreator. All rights reserved.</p>
          <p>This is a secure document delivery notification with enhanced protection.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailData: BrevoEmailData = {
    sender: {
      name: CONFIG.brevo.senderName,
      email: CONFIG.brevo.senderEmail
    },
    to: [{
      email: data.recipientEmail,
      name: 'Valued Customer'
    }],
    subject: `🔐 Secure Document Access - Verification Required (${data.orderId})`,
    htmlContent,
    tags: ['secure-mfa', 'document-delivery', 'verification']
  };

  await sendBrevoEmail(emailData);
};

/**
 * METHOD 2: Blockchain Verification Email
 */
export const sendBlockchainVerificationEmail = async (data: BlockchainEmailData): Promise<void> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>⛓️ Blockchain-Verified Document Delivery</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #7c3aed, #5b21b6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .blockchain-box { background: #f3e8ff; border: 2px solid #7c3aed; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .tx-id { font-family: monospace; background: #1f2937; color: #10b981; padding: 10px; border-radius: 4px; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⛓️ Blockchain-Verified Documents</h1>
          <p>Cryptographically Secured Delivery</p>
        </div>
        
        <div class="content">
          <h2>Your Documents Are Blockchain-Protected</h2>
          
          <div class="blockchain-box">
            <h3 style="color: #7c3aed; margin-top: 0;">🔗 Blockchain Transaction</h3>
            <p><strong>Transaction ID:</strong></p>
            <div class="tx-id">${data.blockchainTxId}</div>
            <p><strong>Proof of Delivery:</strong> ${data.proofOfDelivery}</p>
            <p><strong>Documents:</strong> ${data.documentsCount} files verified</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" 
               style="display: inline-block; padding: 15px 30px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              ⛓️ Verify & Download
            </a>
          </div>
          
          <h3>🛡️ Blockchain Security Benefits:</h3>
          <ul>
            <li><strong>Immutable Records:</strong> Download history cannot be altered</li>
            <li><strong>Cryptographic Proof:</strong> Mathematical verification of delivery</li>
            <li><strong>Transparency:</strong> Verifiable on public blockchain</li>
            <li><strong>Non-Repudiation:</strong> Undeniable proof of access</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailData: BrevoEmailData = {
    sender: {
      name: CONFIG.brevo.senderName,
      email: CONFIG.brevo.senderEmail
    },
    to: [{
      email: data.recipientEmail,
      name: 'Valued Customer'
    }],
    subject: `⛓️ Blockchain-Verified Documents Ready (${data.orderId})`,
    htmlContent,
    tags: ['blockchain', 'document-delivery', 'verification']
  };

  await sendBrevoEmail(emailData);
};

/**
 * METHOD 3: Progressive Download Email
 */
export const sendProgressiveDownloadEmail = async (data: ProgressiveEmailData): Promise<void> => {
  const scheduleHtml = data.unlockSchedule.map(stage => `
    <div style="background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 6px; margin: 10px 0;">
      <h4 style="margin: 0 0 10px 0; color: #0369a1;">${stage.stage.replace('_', ' ').toUpperCase()}</h4>
      <p style="margin: 0;"><strong>Unlocks:</strong> ${new Date(stage.unlockTime).toLocaleString()}</p>
      <p style="margin: 5px 0 0 0;"><strong>Documents:</strong> ${stage.documentsCount} files</p>
    </div>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>📅 Progressive Document Delivery Schedule</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9, #0369a1); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Progressive Document Delivery</h1>
          <p>Your documents will unlock over time</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.customerName},</h2>
          
          <p>Your documents will be delivered progressively according to the schedule below. You'll receive email notifications as each stage unlocks.</p>
          
          <h3>📋 Unlock Schedule:</h3>
          ${scheduleHtml}
          
          <div style="background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">✅ Benefits of Progressive Delivery</h3>
            <ul style="margin: 0; color: #047857;">
              <li>Organized learning path through project stages</li>
              <li>Prevents information overload</li>
              <li>Ensures proper implementation sequence</li>
              <li>Extended access period (30 days total)</li>
            </ul>
          </div>
          
          <p><strong>Order ID:</strong> ${data.orderId}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailData: BrevoEmailData = {
    sender: {
      name: CONFIG.brevo.senderName,
      email: CONFIG.brevo.senderEmail
    },
    to: [{
      email: data.recipientEmail,
      name: data.customerName
    }],
    subject: `📅 Progressive Document Schedule - ${data.orderId}`,
    htmlContent,
    tags: ['progressive-delivery', 'document-schedule']
  };

  await sendBrevoEmail(emailData);
};

/**
 * METHOD 4: Secure Portal Email
 */
export const sendSecurePortalEmail = async (data: PortalEmailData): Promise<void> => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>🏛️ Your Secure Customer Portal</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .credentials-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .password { font-family: monospace; font-size: 18px; font-weight: bold; color: #d97706; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏛️ Your Secure Portal</h1>
          <p>Personalized Document Dashboard</p>
        </div>
        
        <div class="content">
          <h2>Welcome ${data.customerName},</h2>
          
          <p>Your personalized secure portal is ready! Access all your documents through a dedicated dashboard with real-time tracking.</p>
          
          <div class="credentials-box">
            <h3 style="color: #d97706; margin-top: 0;">🔑 Portal Access Credentials</h3>
            <p><strong>Email:</strong> ${data.recipientEmail}</p>
            <p><strong>Temporary Password:</strong></p>
            <div class="password">${data.temporaryPassword}</div>
            <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">
              ⚠️ Change this password after first login
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.portalUrl}" 
               style="display: inline-block; padding: 15px 30px; background: #059669; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              🏛️ Access Your Portal
            </a>
          </div>
          
          <h3>🎯 Portal Features:</h3>
          <ul>
            <li><strong>Document Dashboard:</strong> All ${data.documentsCount} files organized</li>
            <li><strong>Download Tracking:</strong> Monitor your download history</li>
            <li><strong>Support Chat:</strong> Direct communication with our team</li>
            <li><strong>Progress Tracking:</strong> See implementation milestones</li>
            <li><strong>Mobile Friendly:</strong> Access from any device</li>
          </ul>
          
          <p><strong>Order ID:</strong> ${data.orderId}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailData: BrevoEmailData = {
    sender: {
      name: CONFIG.brevo.senderName,
      email: CONFIG.brevo.senderEmail
    },
    to: [{
      email: data.recipientEmail,
      name: data.customerName
    }],
    subject: `🏛️ Your Secure Portal is Ready - ${data.orderId}`,
    htmlContent,
    tags: ['secure-portal', 'customer-dashboard']
  };

  await sendBrevoEmail(emailData);
};

/**
 * METHOD 5: QR Code + Mobile App Email
 */
export const sendQRCodeEmail = async (data: QRCodeEmailData): Promise<void> => {
  // Generate QR code URL using QR Server API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qrCodeData)}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>📱 Mobile QR Code Access</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .qr-box { background: #f8fafc; border: 2px solid #8b5cf6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📱 Mobile QR Access</h1>
          <p>Scan to download securely</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.customerName},</h2>
          
          <p>Access your documents instantly using your mobile device. Simply scan the QR code below or use our mobile app.</p>
          
          <div class="qr-box">
            <h3 style="color: #8b5cf6; margin-top: 0;">📷 Scan QR Code</h3>
            <img src="${qrCodeUrl}" alt="QR Code for Document Access" style="max-width: 200px; height: auto;" />
            <p style="margin: 15px 0 0 0; color: #6b7280;">
              Scan with any QR code reader or camera app
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.mobileAppUrl}" 
               style="display: inline-block; padding: 15px 30px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
              📱 Open in Mobile App
            </a>
          </div>
          
          <h3>📲 Mobile Features:</h3>
          <ul>
            <li><strong>Instant Access:</strong> QR code scanning</li>
            <li><strong>Offline Reading:</strong> Download for offline access</li>
            <li><strong>Secure Storage:</strong> Encrypted local storage</li>
            <li><strong>Share Protection:</strong> Prevents unauthorized sharing</li>
          </ul>
          
          <p><strong>Documents:</strong> ${data.documentsCount} files available</p>
          <p><strong>Order ID:</strong> ${data.orderId}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const emailData: BrevoEmailData = {
    sender: {
      name: CONFIG.brevo.senderName,
      email: CONFIG.brevo.senderEmail
    },
    to: [{
      email: data.recipientEmail,
      name: data.customerName
    }],
    subject: `📱 Mobile QR Access Ready - ${data.orderId}`,
    htmlContent,
    tags: ['qr-code', 'mobile-access', 'document-delivery']
  };

  await sendBrevoEmail(emailData);
};