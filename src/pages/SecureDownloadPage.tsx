import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Mail, 
  Shield,
  FileText,
  Loader,
  RefreshCw,
  ExternalLink,
  Copy
} from 'lucide-react';
import { verifyDownloadToken, getClientIP, requestNewDownloadLinks } from '../utils/secureDownloads';
import { validateEmail } from '../utils/email';
import { formatFileSize } from '../utils/storage';

const SecureDownloadPage = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    document?: any;
    reason?: string;
    tokenData?: any;
  } | null>(null);
  const [clientIP, setClientIP] = useState<string>();
  const [showEmailInput, setShowEmailInput] = useState(!emailParam);
  const [requestingNewLinks, setRequestingNewLinks] = useState(false);
  const [emailError, setEmailError] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    // Get client IP for audit trail
    getClientIP().then(setClientIP);
  }, []);

  useEffect(() => {
    // Auto-verify if email is provided in URL and is valid
    if (token && emailParam && validateEmail(emailParam) && !verificationResult) {
      handleVerifyAccess();
    }
  }, [token, emailParam]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Clear email error when user starts typing
    if (emailError) {
      setEmailError('');
    }
    
    // Validate email in real-time
    if (newEmail && !validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handleVerifyAccess = async () => {
    if (!token) {
      setVerificationResult({
        valid: false,
        reason: 'No download token provided in the URL'
      });
      return;
    }

    if (!email) {
      setEmailError('Email address is required');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    setEmailError('');

    try {
      console.log('🔍 Starting verification process...');
      console.log('🎫 Token:', token);
      console.log('📧 Email:', email);

      const result = await verifyDownloadToken(
        token,
        email,
        clientIP,
        navigator.userAgent
      );

      console.log('✅ Verification result:', result);
      setVerificationResult(result);
      
      if (!result.valid) {
        setShowEmailInput(true);
      }
    } catch (error) {
      console.error('💥 Error verifying access:', error);
      setVerificationResult({
        valid: false,
        reason: 'A system error occurred while verifying your access. Please try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = async () => {
    if (!verificationResult?.valid || !verificationResult.document) return;

    setIsDownloading(true);
    
    try {
      console.log('📥 Starting download...');
      console.log('📄 Document:', verificationResult.document);

      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = verificationResult.document.url;
      link.download = verificationResult.document.name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Add the link to the document temporarily
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      // Show success message
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
      
      console.log('✅ Download initiated successfully');
    } catch (error) {
      console.error('💥 Error downloading file:', error);
      alert('Failed to download the file. Please try again or contact support.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRequestNewLinks = async () => {
    if (!verificationResult?.tokenData?.order_id) return;

    setRequestingNewLinks(true);
    
    try {
      const success = await requestNewDownloadLinks(
        verificationResult.tokenData.order_id,
        email
      );
      
      if (success) {
        alert('Request submitted successfully! You will receive new download links via email within 24 hours.');
      } else {
        alert('Failed to submit request. Please contact support directly at mohanselenophile@gmail.com');
      }
    } catch (error) {
      console.error('Error requesting new links:', error);
      alert('Failed to submit request. Please contact support directly at mohanselenophile@gmail.com');
    } finally {
      setRequestingNewLinks(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard:', text);
    });
  };

  const formatExpirationTime = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return 'Expired';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else {
      return `${diffMinutes}m remaining`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-6 max-w-2xl">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200 mb-2">
              Secure Document Download
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Verify your email to access your purchased documents
            </p>
          </div>

          {/* Email Input */}
          {showEmailInput && !verificationResult?.valid && (
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address *
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 ${
                      emailError 
                        ? 'border-red-300 dark:border-red-700' 
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                    placeholder="Enter your email address"
                    disabled={isVerifying}
                  />
                  <Mail className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
                </div>
                
                {emailError && (
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {emailError}
                  </p>
                )}
                
                <button
                  onClick={handleVerifyAccess}
                  disabled={!email || isVerifying || !!emailError}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isVerifying ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Verify Access
                    </>
                  )}
                </button>
              </div>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                Enter the email address used for your purchase
              </p>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult && (
            <div className="mb-6">
              {verificationResult.valid ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <div className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">
                        ✅ Access Verified Successfully
                      </h3>
                      
                      {downloadSuccess && (
                        <div className="mb-4 p-3 bg-green-100 dark:bg-green-800 rounded-lg">
                          <p className="text-green-800 dark:text-green-200 text-sm font-medium">
                            🎉 Download started successfully! Check your downloads folder.
                          </p>
                        </div>
                      )}
                      
                      {/* Document Info */}
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4 border border-green-200 dark:border-green-700">
                        <div className="flex items-center mb-3">
                          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-3" />
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-slate-200">
                              {verificationResult.document.name}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                              <span>Size: {formatFileSize(verificationResult.document.size)}</span>
                              <span>•</span>
                              <span className="capitalize">{verificationResult.document.document_category}</span>
                              <span>•</span>
                              <span className="capitalize">{verificationResult.document.review_stage?.replace('_', ' ')}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(verificationResult.document.url)}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            title="Copy download URL"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="flex space-x-3">
                          <button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isDownloading ? (
                              <>
                                <Loader className="h-5 w-5 mr-2 animate-spin" />
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="h-5 w-5 mr-2" />
                                Download Document
                              </>
                            )}
                          </button>
                          
                          <a
                            href={verificationResult.document.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center"
                            title="Open in new tab"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        </div>
                      </div>

                      {/* Download Info */}
                      <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>
                            {formatExpirationTime(verificationResult.tokenData.expires_at)}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Download className="h-4 w-4 mr-2" />
                          <span>
                            Downloads: {verificationResult.tokenData.download_count} / {verificationResult.tokenData.max_downloads}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          <span>Authorized for: {email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <div className="flex items-start">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-red-800 dark:text-red-300 mb-2">
                        ❌ Access Denied
                      </h3>
                      <p className="text-red-700 dark:text-red-400 mb-4">
                        {verificationResult.reason}
                      </p>
                      
                      {/* Action buttons based on error type */}
                      <div className="space-y-3">
                        {verificationResult.reason?.includes('expired') && (
                          <button
                            onClick={handleRequestNewLinks}
                            disabled={requestingNewLinks}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {requestingNewLinks ? (
                              <>
                                <Loader className="h-4 w-4 mr-2 animate-spin" />
                                Requesting...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Request New Links
                              </>
                            )}
                          </button>
                        )}
                        
                        {(verificationResult.reason?.includes('email') || verificationResult.reason?.includes('authorized')) && (
                          <button
                            onClick={() => {
                              setShowEmailInput(true);
                              setVerificationResult(null);
                              setEmail('');
                              setEmailError('');
                            }}
                            className="flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Try Different Email
                          </button>
                        )}
                        
                        {verificationResult.reason?.includes('Invalid') && (
                          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                              💡 <strong>Tip:</strong> Make sure you're using the correct download link from your email. 
                              Links are case-sensitive and must be copied exactly.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <h4 className="font-medium mb-1">🔒 Security Features</h4>
                <ul className="space-y-1 text-blue-700 dark:text-blue-400">
                  <li>• Download links are time-limited and email-specific</li>
                  <li>• Links cannot be shared or forwarded to other users</li>
                  <li>• All download attempts are logged for security</li>
                  <li>• Email verification is required for each access</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Support Contact */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Need help? Contact us at{' '}
              <a 
                href="mailto:mohanselenophile@gmail.com" 
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                mohanselenophile@gmail.com
              </a>
            </p>
            {verificationResult?.tokenData?.order_id && (
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Order ID: {verificationResult.tokenData.order_id}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureDownloadPage;