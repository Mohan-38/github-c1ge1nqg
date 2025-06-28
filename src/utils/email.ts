// Brevo Email Service Integration
// Brevo (formerly Sendinblue) configuration for transactional emails with attachments

// Configuration
export const CONFIG = {
  brevo: {
    apiUrl: 'https://api.brevo.com/v3/smtp/email',
    // You'll need to set this in your environment variables
    apiKey: import.meta.env.VITE_BREVO_API_KEY || '',
    // Use your validated sender email
    senderEmail: 'mohanselenophile@gmail.com', // Your validated email
    senderName: 'Tech Creator'
  },
  emailjs: {
    serviceId: 'service_qj44izj',
    publicKey: 'aImlP6dotqO-E3y6h',
    templates: {
      contact: 'template_k92zaj2',
      order: 'purchase_confirmation',
      documentDelivery: 'template_document_delivery' // Add this template
    }
  },
  developerEmail: 'mohanselenophile@gmail.com'
};

// Type Definitions
interface ContactFormData {
  from_name: string;
  from_email: string;
  project_type: string;
  budget: string;
  message: string;
}

interface OrderConfirmationData {
  project_title: string;
  customer_name: string;
  price: string;
  download_instructions?: string;
  support_email?: string;
  order_id?: string;
}

interface DocumentDeliveryData {
  project_title: string;
  customer_name: string;
  customer_email: string;
  order_id: string;
  documents: Array<{
    name: string;
    url: string;
    category: string;
    review_stage: string;
    size?: number;
  }>;
  access_expires?: string;
}

interface SecureDocumentDeliveryData {
  project_title: string;
  customer_name: string;
  customer_email: string;
  order_id: string;
  secureDocuments: Array<{
    documentName: string;
    secureUrl: string;
    category: string;
    review_stage: string;
    size?: number;
  }>;
  expiresAt: string;
  maxDownloads: number;
}

export interface BrevoEmailData {
  sender: {
    name: string;
    email: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  attachment?: Array<{
    name: string;
    content: string; // Base64 encoded content
    url?: string; // Alternative to content for URL-based attachments
  }>;
  tags?: string[];
}

// Utility Functions
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const getCurrentDateTime = () => {
  const now = new Date();
  return {
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    datetime: now.toISOString()
  };
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Brevo API Service
export const sendBrevoEmail = async (emailData: BrevoEmailData): Promise<void> => {
  if (!CONFIG.brevo.apiKey) {
    console.warn('Brevo API key is not configured. Please check your environment variables.');
    throw new Error('Brevo not configured - Please add VITE_BREVO_API_KEY to your environment');
  }

  try {
    console.log('🚀 Sending email via Brevo to:', emailData.to[0].email);
    console.log('📧 Using sender:', emailData.sender.email);
    console.log('📝 Subject:', emailData.subject);
    
    const response = await fetch(CONFIG.brevo.apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': CONFIG.brevo.apiKey
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Brevo API error response:', errorData);
      
      // Handle specific sender validation error
      if (response.status === 400 && errorData.message?.includes('sender')) {
        console.error('🚫 Brevo sender validation error. Please validate your sender email in Brevo dashboard.');
        throw new Error('Sender validation failed - Please validate your email in Brevo dashboard at https://app.brevo.com/senders/list');
      }
      
      if (response.status === 401) {
        throw new Error('Invalid Brevo API key - Please check your VITE_BREVO_API_KEY');
      }
      
      throw new Error(`Brevo API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('✅ Email sent successfully via Brevo:', result);
    return result;
  } catch (error) {
    console.error('❌ Brevo email sending failed:', error);
    throw error;
  }
};

// Contact Form Service - Using Brevo
export const sendContactForm = async (data: ContactFormData): Promise<void> => {
  if (!validateEmail(data.from_email)) {
    throw new Error('Invalid sender email address');
  }

  const { date, time } = getCurrentDateTime();

  // Try Brevo first
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Contact Form Inquiry - TechCreator</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .inquiry-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .highlight { color: #3b82f6; font-weight: bold; }
          .label { font-weight: bold; color: #374151; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 New Contact Form Inquiry</h1>
            <p>You have received a new project inquiry!</p>
          </div>
          
          <div class="content">
            <h2>Contact Details</h2>
            
            <div class="inquiry-details">
              <p><span class="label">Name:</span> <span class="highlight">${data.from_name}</span></p>
              <p><span class="label">Email:</span> <a href="mailto:${data.from_email}" class="highlight">${data.from_email}</a></p>
              <p><span class="label">Project Type:</span> ${data.project_type}</p>
              <p><span class="label">Budget Range:</span> ${data.budget}</p>
              <p><span class="label">Inquiry Date:</span> ${date} at ${time}</p>
            </div>
            
            <h3>Project Details</h3>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
            </div>
            
            <div style="margin-top: 30px; padding: 20px; background: #ecfdf5; border-radius: 8px; border: 1px solid #10b981;">
              <h3 style="color: #059669; margin-top: 0;">📋 Next Steps</h3>
              <ul style="margin: 0;">
                <li>Review the project requirements</li>
                <li>Prepare a detailed proposal</li>
                <li>Reply to the client within 24 hours</li>
                <li>Schedule a consultation call if needed</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px;">
              <strong>Reply directly to this email to respond to the client.</strong>
            </p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 TechCreator. All rights reserved.</p>
            <p>This is an automated notification from your website contact form.</p>
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
        email: CONFIG.developerEmail,
        name: 'Tech Creator'
      }],
      subject: `🚀 New Project Inquiry from ${data.from_name} - ${data.project_type}`,
      htmlContent,
      tags: ['contact-form', 'inquiry', 'website']
    };

    await sendBrevoEmail(emailData);
    console.log('Contact form email sent successfully via Brevo');
  } catch (brevoError) {
    console.error('Brevo contact form failed, trying EmailJS fallback...', brevoError);
    
    // Fallback to EmailJS
    try {
      const emailjs = await import('@emailjs/browser');
      
      await emailjs.send(
        CONFIG.emailjs.serviceId,
        CONFIG.emailjs.templates.contact,
        {
          name: data.from_name,
          email: data.from_email,
          project_type: data.project_type,
          budget: data.budget,
          message: data.message,
          current_date: date,
          current_time: time,
          title: `New inquiry from ${data.from_name}`,
          to_email: CONFIG.developerEmail,
          reply_to: data.from_email
        },
        CONFIG.emailjs.publicKey
      );
      
      console.log('Contact form email sent successfully via EmailJS fallback');
    } catch (emailjsError) {
      console.error('Both Brevo and EmailJS failed for contact form:', emailjsError);
      throw new Error('Failed to send your message. Please try again later or contact us directly.');
    }
  }
};

export const sendOrderConfirmation = async (
  data: OrderConfirmationData,
  recipientEmail: string
): Promise<void> => {
  if (!validateEmail(recipientEmail)) {
    throw new Error('Invalid recipient email address');
  }

  const { date } = getCurrentDateTime();

  // Try Brevo first, fallback to EmailJS
  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - TechCreator</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .order-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .highlight { color: #3b82f6; font-weight: bold; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
            <p>Thank you for your purchase!</p>
          </div>
          
          <div class="content">
            <h2>Hello ${data.customer_name},</h2>
            
            <p>Your order has been confirmed and is being processed. Here are your order details:</p>
            
            <div class="order-details">
              <h3>Order Information</h3>
              <p><strong>Order ID:</strong> <span class="highlight">${data.order_id}</span></p>
              <p><strong>Project:</strong> ${data.project_title}</p>
              <p><strong>Amount Paid:</strong> <span class="highlight">${data.price}</span></p>
              <p><strong>Order Date:</strong> ${date}</p>
            </div>
            
            <div class="warning">
              <h3>📧 Document Delivery</h3>
              <p><strong>You will receive a separate email within 5 minutes</strong> containing download links for all project documents.</p>
              <p><strong>Note:</strong> If no documents are currently available, you'll receive a "Documents Coming Soon" notification with delivery timeline.</p>
            </div>
            
            <h3>What's Included:</h3>
            <ul>
              <li>Complete source code and project files</li>
              <li>Comprehensive documentation across 3 review stages</li>
              <li>Installation and setup guides</li>
              <li>Technical specifications and implementation details</li>
              <li>Email support for technical questions</li>
            </ul>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact us at <a href="mailto:${CONFIG.developerEmail}">${CONFIG.developerEmail}</a></p>
            
            <p>Thank you for choosing TechCreator!</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 TechCreator. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
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
        email: recipientEmail,
        name: data.customer_name
      }],
      subject: `Order Confirmation - ${data.project_title} (${data.order_id})`,
      htmlContent,
      tags: ['order-confirmation', 'transactional']
    };

    await sendBrevoEmail(emailData);
  } catch (error) {
    console.error('Order confirmation failed:', error);
    // Don't throw error for order confirmation - order should still complete
    console.log('Order completed successfully, but email notification failed.');
  }
};

// NEW: Send "Documents Coming Soon" notification when no documents are available
export const sendNoDocumentsNotification = async (data: DocumentDeliveryData): Promise<void> => {
  if (!validateEmail(data.customer_email)) {
    throw new Error('Invalid recipient email address');
  }

  console.log('📋 Sending "Documents Coming Soon" notification...');
  console.log('📧 Sending to:', data.customer_email);

  const { date } = getCurrentDateTime();

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>📋 Project Documents Coming Soon - TechCreator</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .summary { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #f59e0b; }
          .highlight { color: #d97706; font-weight: bold; }
          .timeline { background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Project Documents Coming Soon</h1>
            <p>Your order is confirmed and being prepared!</p>
          </div>
          
          <div class="content">
            <h2>Hello ${data.customer_name},</h2>
            
            <p>Thank you for purchasing <strong>${data.project_title}</strong>! Your order has been successfully processed.</p>
            
            <div class="summary">
              <h3>📊 Order Summary</h3>
              <p><strong>Order ID:</strong> <span class="highlight">${data.order_id}</span></p>
              <p><strong>Project:</strong> ${data.project_title}</p>
              <p><strong>Order Date:</strong> ${date}</p>
              <p><strong>Status:</strong> <span class="highlight">Processing</span></p>
            </div>
            
            <div class="timeline">
              <h3>⏰ Document Delivery Timeline</h3>
              <p><strong>Your project documents will be delivered within 3 business days.</strong></p>
              
              <div style="margin: 20px 0;">
                <h4>What you'll receive:</h4>
                <ul>
                  <li>📁 Complete source code and project files</li>
                  <li>📚 Comprehensive documentation (3 review stages)</li>
                  <li>🔧 Installation and setup guides</li>
                  <li>📋 Technical specifications</li>
                  <li>💡 Implementation guidelines</li>
                  <li>🎯 Project review presentations</li>
                </ul>
              </div>
              
              <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981;">
                <p style="margin: 0;"><strong>📧 Delivery Method:</strong> All documents will be sent to this email address with direct download links organized by review stages.</p>
              </div>
            </div>
            
            <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">🔔 What happens next?</h3>
              <ol style="margin: 0;">
                <li><strong>Document Preparation:</strong> Our team is organizing your project files</li>
                <li><strong>Quality Check:</strong> Ensuring all documents are complete and accessible</li>
                <li><strong>Email Delivery:</strong> You'll receive download links within 3 days</li>
                <li><strong>Lifetime Access:</strong> Save the email for future downloads</li>
              </ol>
            </div>
            
            <h3>💬 Need Immediate Assistance?</h3>
            <p>If you have any questions or need urgent support, please contact us:</p>
            <p><strong>Email:</strong> <a href="mailto:${CONFIG.developerEmail}">${CONFIG.developerEmail}</a></p>
            <p><strong>Response Time:</strong> Within 24 hours</p>
            
            <p>Thank you for choosing TechCreator. We're preparing your project documents with care!</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 TechCreator. All rights reserved.</p>
            <p>This is an automated notification. Your documents are being prepared.</p>
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
        email: data.customer_email,
        name: data.customer_name
      }],
      subject: `📋 Documents Coming Soon - ${data.project_title} (${data.order_id})`,
      htmlContent,
      tags: ['document-preparation', 'order-processing', 'coming-soon']
    };

    await sendBrevoEmail(emailData);
    console.log('✅ "Documents coming soon" email sent successfully via Brevo');
  } catch (error) {
    console.error('❌ Failed to send "documents coming soon" email:', error);
    throw error;
  }
};

// NEW: Secure Document Delivery with time-limited links
export const sendSecureDocumentDelivery = async (data: SecureDocumentDeliveryData): Promise<void> => {
  if (!validateEmail(data.customer_email)) {
    throw new Error('Invalid recipient email address');
  }

  console.log('🚀 Starting SECURE document delivery process...');
  console.log('📊 Secure documents available:', data.secureDocuments.length);
  console.log('📧 Sending to:', data.customer_email);

  const { date } = getCurrentDateTime();

  // Group documents by review stage
  const documentsByStage = {
    review_1: data.secureDocuments.filter(doc => doc.review_stage === 'review_1'),
    review_2: data.secureDocuments.filter(doc => doc.review_stage === 'review_2'),
    review_3: data.secureDocuments.filter(doc => doc.review_stage === 'review_3')
  };

  const stageLabels = {
    review_1: 'Review 1 - Initial Project Review',
    review_2: 'Review 2 - Mid-Project Assessment', 
    review_3: 'Review 3 - Final Review & Completion'
  };

  // Calculate expiration time
  const expiresAt = new Date(data.expiresAt);
  const expirationHours = Math.round((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));

  // Generate HTML content for secure documents
  const generateStageHtml = (stage: keyof typeof documentsByStage) => {
    const docs = documentsByStage[stage];
    if (docs.length === 0) return '';

    return `
      <div style="margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0;">${stageLabels[stage]}</h3>
        <div style="display: grid; gap: 10px;">
          ${docs.map(doc => `
            <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div>
                  <h4 style="margin: 0 0 5px 0; color: #1f2937;">${doc.documentName}</h4>
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    Category: ${doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}
                    ${doc.size ? ` • Size: ${formatFileSize(doc.size)}` : ''}
                  </p>
                </div>
              </div>
              <a href="${doc.secureUrl}" 
                 style="display: inline-block; padding: 8px 16px; background: #10b981; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;"
                 target="_blank">
                🔒 Secure Download
              </a>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  try {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Secure Project Documents - ${data.project_title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .summary { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #10b981; }
          .highlight { color: #059669; font-weight: bold; }
          .security-notice { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .urgent { background: #fee2e2; border: 1px solid #ef4444; padding: 15px; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Secure Project Documents</h1>
            <p>Your time-limited, secure download links are ready!</p>
          </div>
          
          <div class="content">
            <h2>Hello ${data.customer_name},</h2>
            
            <p>Your secure project documents for <strong>${data.project_title}</strong> are now available for download!</p>
            
            <div class="urgent">
              <h3 style="color: #dc2626; margin-top: 0;">⏰ IMPORTANT: Time-Limited Access</h3>
              <p style="margin: 0; color: #991b1b;">
                <strong>These download links expire in ${expirationHours} hours (${expiresAt.toLocaleString()}).</strong><br>
                Please download all files promptly to avoid losing access.
              </p>
            </div>
            
            <div class="summary">
              <h3>📊 Document Summary</h3>
              <p><strong>Order ID:</strong> <span class="highlight">${data.order_id}</span></p>
              <p><strong>Total Documents:</strong> ${data.secureDocuments.length}</p>
              <p><strong>Download Limit:</strong> ${data.maxDownloads} downloads per document</p>
              <p><strong>Authorized Email:</strong> ${data.customer_email}</p>
              <p><strong>Expires:</strong> ${expiresAt.toLocaleString()}</p>
            </div>
            
            <h3>📋 Secure Documents by Review Stage</h3>
            <p>Click the secure download buttons below. Each link is personalized for your email address:</p>
            
            ${generateStageHtml('review_1')}
            ${generateStageHtml('review_2')}
            ${generateStageHtml('review_3')}
            
            <div class="security-notice">
              <h3 style="color: #d97706; margin-top: 0;">🔐 Security Features</h3>
              <ul style="margin: 0;">
                <li><strong>Email Verification:</strong> Links only work for ${data.customer_email}</li>
                <li><strong>Time-Limited:</strong> Access expires in ${expirationHours} hours</li>
                <li><strong>Download Tracking:</strong> Limited to ${data.maxDownloads} downloads per document</li>
                <li><strong>No Sharing:</strong> Links cannot be forwarded to other users</li>
                <li><strong>Audit Trail:</strong> All access attempts are logged for security</li>
              </ul>
            </div>
            
            <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">📥 Download Instructions</h3>
              <ol style="margin: 0;">
                <li>Click the "🔒 Secure Download" button for each document</li>
                <li>You'll be asked to verify your email address</li>
                <li>Once verified, the download will start automatically</li>
                <li>Save all files to your computer before the links expire</li>
              </ol>
            </div>
            
            <div style="background: #fee2e2; border: 1px solid #ef4444; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">⚠️ What if links expire?</h3>
              <p style="margin: 0; color: #991b1b;">
                If your download links expire, you can request new ones by contacting us at 
                <a href="mailto:${CONFIG.developerEmail}" style="color: #dc2626;">${CONFIG.developerEmail}</a>
                with your order ID: <strong>${data.order_id}</strong>
              </p>
            </div>
            
            <h3>💬 Need Help?</h3>
            <p>If you have any questions about downloading, implementation, or need technical support:</p>
            <p><strong>Email:</strong> <a href="mailto:${CONFIG.developerEmail}">${CONFIG.developerEmail}</a></p>
            <p><strong>Order ID:</strong> ${data.order_id}</p>
            
            <p>Thank you for choosing TechCreator. Download your files securely!</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2025 TechCreator. All rights reserved.</p>
            <p>This email contains secure, time-limited download links. Please keep it safe.</p>
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
        email: data.customer_email,
        name: data.customer_name
      }],
      subject: `🔒 Secure Documents Ready - ${data.project_title} (Expires in ${expirationHours}h)`,
      htmlContent,
      tags: ['secure-document-delivery', 'time-limited', 'transactional']
    };

    await sendBrevoEmail(emailData);
    console.log('✅ SECURE document delivery email sent successfully via Brevo');

  } catch (brevoError) {
    console.log('❌ Brevo failed for secure document delivery, trying EmailJS fallback...');
    console.error('Brevo error:', brevoError);
    
    try {
      await sendEmailJSSecureDocumentDelivery(data);
      console.log('✅ SECURE document delivery email sent successfully via EmailJS');
    } catch (emailjsError) {
      console.error('❌ Both Brevo and EmailJS failed for secure document delivery');
      console.error('EmailJS error:', emailjsError);
      
      // Throw error so the UI shows the failure
      throw new Error(`Failed to send secure document delivery email: ${brevoError.message || emailjsError.message}`);
    }
  }
};

// EmailJS fallback for secure document delivery
const sendEmailJSSecureDocumentDelivery = async (data: SecureDocumentDeliveryData): Promise<void> => {
  try {
    const emailjs = await import('@emailjs/browser');
    
    // Create document list text for EmailJS
    const documentListText = data.secureDocuments.map(doc => 
      `${doc.documentName} (${doc.category}) - ${doc.secureUrl}`
    ).join('\n');

    const { date } = getCurrentDateTime();
    const expiresAt = new Date(data.expiresAt);

    await emailjs.send(
      CONFIG.emailjs.serviceId,
      CONFIG.emailjs.templates.contact, // Using contact template as fallback
      {
        name: 'TechCreator Secure Document Delivery',
        email: CONFIG.developerEmail,
        project_type: 'Secure Document Delivery',
        budget: 'N/A',
        message: `SECURE document delivery for ${data.customer_name}\n\nOrder: ${data.order_id}\nProject: ${data.project_title}\n\nSECURE LINKS (Time-limited):\n${documentListText}\n\nExpires: ${expiresAt.toLocaleString()}\nMax Downloads: ${data.maxDownloads}\nAuthorized Email: ${data.customer_email}\n\nDelivery Date: ${date}`,
        to_email: data.customer_email,
        reply_to: CONFIG.developerEmail
      },
      CONFIG.emailjs.publicKey
    );

    console.log('Secure document delivery email sent via EmailJS fallback');
  } catch (error) {
    console.error('EmailJS secure document delivery failed:', error);
    throw error;
  }
};

// LEGACY: Keep the old function for backward compatibility
export const sendDocumentDelivery = async (data: DocumentDeliveryData): Promise<void> => {
  console.warn('⚠️ Using legacy sendDocumentDelivery. Consider upgrading to sendSecureDocumentDelivery for enhanced security.');
  
  if (!validateEmail(data.customer_email)) {
    throw new Error('Invalid recipient email address');
  }

  console.log('🚀 Starting LEGACY document delivery process...');
  console.log('📊 Documents available:', data.documents.length);
  console.log('📧 Sending to:', data.customer_email);

  // Check if documents are available
  if (data.documents.length === 0) {
    console.log('📭 No documents available, sending "coming soon" email...');
    await sendNoDocumentsNotification(data);
    return;
  }

  // Documents are available, send them via Brevo (LEGACY EMAIL)
  try {
    await sendBrevoDocumentDelivery(data);
    console.log('✅ LEGACY document delivery email sent successfully via Brevo');
  } catch (brevoError) {
    console.log('❌ Brevo failed for document delivery, trying EmailJS fallback...');
    console.error('Brevo error:', brevoError);
    
    try {
      await sendEmailJSDocumentDelivery(data);
      console.log('✅ LEGACY document delivery email sent successfully via EmailJS');
    } catch (emailjsError) {
      console.error('❌ Both Brevo and EmailJS failed for document delivery');
      console.error('EmailJS error:', emailjsError);
      
      // Throw error so the UI shows the failure
      throw new Error(`Failed to send document delivery email: ${brevoError.message || emailjsError.message}`);
    }
  }
};

// Brevo document delivery (when documents are available) - LEGACY
const sendBrevoDocumentDelivery = async (data: DocumentDeliveryData): Promise<void> => {
  const { date } = getCurrentDateTime();

  // Group documents by review stage
  const documentsByStage = {
    review_1: data.documents.filter(doc => doc.review_stage === 'review_1'),
    review_2: data.documents.filter(doc => doc.review_stage === 'review_2'),
    review_3: data.documents.filter(doc => doc.review_stage === 'review_3')
  };

  const stageLabels = {
    review_1: 'Review 1 - Initial Project Review',
    review_2: 'Review 2 - Mid-Project Assessment', 
    review_3: 'Review 3 - Final Review & Completion'
  };

  // Generate HTML content for documents
  const generateStageHtml = (stage: keyof typeof documentsByStage) => {
    const docs = documentsByStage[stage];
    if (docs.length === 0) return '';

    return `
      <div style="margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
        <h3 style="color: #1e40af; margin: 0 0 15px 0;">${stageLabels[stage]}</h3>
        <div style="display: grid; gap: 10px;">
          ${docs.map(doc => `
            <div style="background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div>
                  <h4 style="margin: 0 0 5px 0; color: #1f2937;">${doc.name}</h4>
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">
                    Category: ${doc.category.charAt(0).toUpperCase() + doc.category.slice(1)}
                    ${doc.size ? ` • Size: ${formatFileSize(doc.size)}` : ''}
                  </p>
                </div>
              </div>
              <a href="${doc.url}" 
                 style="display: inline-block; padding: 8px 16px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 500;"
                 target="_blank">
                📥 Download Document
              </a>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Project Documents - ${data.project_title}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
        .summary { background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #10b981; }
        .highlight { color: #059669; font-weight: bold; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📁 Project Documents Delivered</h1>
          <p>Your complete project package is ready!</p>
        </div>
        
        <div class="content">
          <h2>Hello ${data.customer_name},</h2>
          
          <p>Your project documents for <strong>${data.project_title}</strong> are now available for download!</p>
          
          <div class="summary">
            <h3>📊 Document Summary</h3>
            <p><strong>Order ID:</strong> <span class="highlight">${data.order_id}</span></p>
            <p><strong>Total Documents:</strong> ${data.documents.length}</p>
            <p><strong>Access:</strong> ${data.access_expires || 'Lifetime access'}</p>
            <p><strong>Delivery Date:</strong> ${date}</p>
          </div>
          
          <h3>📋 Documents by Review Stage</h3>
          <p>Your documents are organized by project review stages for easy navigation:</p>
          
          ${generateStageHtml('review_1')}
          ${generateStageHtml('review_2')}
          ${generateStageHtml('review_3')}
          
          <div class="warning">
            <h3>⚠️ Important Notes</h3>
            <ul>
              <li><strong>Save these links:</strong> Bookmark or save this email for future access</li>
              <li><strong>Download soon:</strong> While you have lifetime access, we recommend downloading files promptly</li>
              <li><strong>Technical support:</strong> Contact us if you have any questions about implementation</li>
              <li><strong>File issues:</strong> If any download links don't work, contact support immediately</li>
            </ul>
          </div>
          
          <h3>💬 Need Help?</h3>
          <p>If you have any questions about the project, implementation, or need technical support, please contact us at:</p>
          <p><strong>Email:</strong> <a href="mailto:${CONFIG.developerEmail}">${CONFIG.developerEmail}</a></p>
          
          <p>Thank you for choosing TechCreator. We hope this project serves you well!</p>
        </div>
        
        <div class="footer">
          <p>&copy; 2025 TechCreator. All rights reserved.</p>
          <p>This email contains your purchased project documents. Please keep it safe.</p>
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
      email: data.customer_email,
      name: data.customer_name
    }],
    subject: `📁 Project Documents Ready - ${data.project_title} (${data.order_id})`,
    htmlContent,
    tags: ['document-delivery', 'transactional', 'project-files']
  };

  // This is the LEGACY email sending call
  await sendBrevoEmail(emailData);
};

// EmailJS fallback for document delivery - LEGACY
const sendEmailJSDocumentDelivery = async (data: DocumentDeliveryData): Promise<void> => {
  try {
    const emailjs = await import('@emailjs/browser');
    
    // Group documents by review stage
    const documentsByStage = {
      review_1: data.documents.filter(doc => doc.review_stage === 'review_1'),
      review_2: data.documents.filter(doc => doc.review_stage === 'review_2'),
      review_3: data.documents.filter(doc => doc.review_stage === 'review_3')
    };

    const stageLabels = {
      review_1: 'Review 1 - Initial Project Review',
      review_2: 'Review 2 - Mid-Project Assessment', 
      review_3: 'Review 3 - Final Review & Completion'
    };

    // Create document list text
    const documentListText = Object.entries(documentsByStage)
      .filter(([_, docs]) => docs.length > 0)
      .map(([stage, docs]) => {
        const stageLabel = stageLabels[stage as keyof typeof stageLabels];
        const docList = docs.map(doc => `• ${doc.name} (${doc.category}) - ${doc.url}`).join('\n');
        return `${stageLabel}:\n${docList}`;
      }).join('\n\n');

    const { date } = getCurrentDateTime();

    await emailjs.send(
      CONFIG.emailjs.serviceId,
      CONFIG.emailjs.templates.contact, // Using contact template as fallback
      {
        name: 'TechCreator Document Delivery',
        email: CONFIG.developerEmail,
        project_type: 'Document Delivery',
        budget: 'N/A',
        message: `Document delivery for ${data.customer_name}\n\nOrder: ${data.order_id}\nProject: ${data.project_title}\n\nDocuments:\n${documentListText}\n\nDelivery Date: ${date}`,
        to_email: data.customer_email,
        reply_to: CONFIG.developerEmail
      },
      CONFIG.emailjs.publicKey
    );

    console.log('Document delivery email sent via EmailJS fallback');
  } catch (error) {
    console.error('EmailJS document delivery failed:', error);
    throw error;
  }
};

// Generate download instructions for order confirmation
export const generateDownloadInstructions = (projectTitle: string, orderId: string): string => {
  return `
Thank you for purchasing "${projectTitle}"!

Your Order ID: ${orderId}

What happens next:
1. You will receive a separate email within 5 minutes containing download links for all project documents
2. If no documents are currently available, you'll receive a "Documents Coming Soon" notification
3. Documents are organized by review stages (Review 1, 2, and 3)
4. Each document includes presentations, documentation, and reports as applicable

The document delivery email will include:
• Direct download links or "Coming Soon" notification
• Documents grouped by review stage (when available)
• File size information
• Technical specifications
• Implementation guides

If you have any questions or need support, please contact us at ${CONFIG.developerEmail}

Thank you for your business!
  `.trim();
};

// Configuration check function
export const checkBrevoConfiguration = (): {
  configured: boolean;
  apiKey: boolean;
  senderEmail: string;
  issues: string[];
} => {
  const issues: string[] = [];
  
  if (!CONFIG.brevo.apiKey) {
    issues.push('Brevo API key is missing - Add VITE_BREVO_API_KEY to your .env file');
  }
  
  if (!CONFIG.brevo.senderEmail) {
    issues.push('Sender email is not configured');
  }
  
  return {
    configured: issues.length === 0,
    apiKey: !!CONFIG.brevo.apiKey,
    senderEmail: CONFIG.brevo.senderEmail,
    issues
  };
};

// Test function for development
export const testDocumentDelivery = async () => {
  const testData: DocumentDeliveryData = {
    project_title: 'Test Project',
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    order_id: 'TEST123',
    documents: [
      {
        name: 'Test Document.pdf',
        url: 'https://example.com/test.pdf',
        category: 'document',
        review_stage: 'review_1',
        size: 1024000
      }
    ]
  };

  try {
    await sendDocumentDelivery(testData);
    console.log('Test document delivery sent successfully');
  } catch (error) {
    console.error('Test document delivery failed:', error);
  }
};

// Setup instructions for Brevo
export const getBrevoSetupInstructions = (): string => {
  return `
BREVO EMAIL SETUP INSTRUCTIONS:

1. Create Brevo Account:
   - Go to https://app.brevo.com/
   - Sign up for a free account

2. Get API Key:
   - Go to https://app.brevo.com/settings/keys/api
   - Create a new API key
   - Add it to your .env file as VITE_BREVO_API_KEY

3. Validate Sender Email:
   - Go to https://app.brevo.com/senders/list
   - Click "Add a sender"
   - Add your email (mohanselenophile@gmail.com)
   - Verify it via the confirmation email

4. Test Email Delivery:
   - Use the test function in the email utils
   - Check Brevo dashboard for delivery statistics

Current Configuration:
- Sender Email: ${CONFIG.brevo.senderEmail}
- Sender Name: ${CONFIG.brevo.senderName}
- API Key: ${CONFIG.brevo.apiKey ? 'Configured' : 'Not configured'}
  `;
};