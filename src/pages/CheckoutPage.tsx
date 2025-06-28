import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  Smartphone, 
  Shield, 
  CheckCircle, 
  XCircle,
  Copy,
  ExternalLink,
  Clock,
  AlertCircle,
  FileText,
  Download
} from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { sendOrderConfirmation, generateDownloadInstructions } from '../utils/email';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  enabled: boolean;
}

interface UPIApp {
  id: string;
  name: string;
  packageName: string;
  icon: string;
}

const CheckoutPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, addOrder, getProjectDocuments } = useProjects();
  const project = projects.find(p => p.id === id);
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('');
  
  // Payment state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [showQRCode, setShowQRCode] = useState(false);

  // Merchant UPI ID (replace with your actual UPI ID)
  const MERCHANT_UPI_ID = '9182054415@ibl'; // Replace with your UPI ID
  const MERCHANT_NAME = 'TechCreator';

  useEffect(() => {
    if (!project) {
      navigate('/projects');
    }
  }, [project, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (paymentStatus === 'pending' && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && paymentStatus === 'pending') {
      setPaymentStatus('failed');
    }
    return () => clearTimeout(timer);
  }, [paymentStatus, timeRemaining]);

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-28 pb-16 flex items-center justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 max-w-md mx-auto text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200 mb-4">Project Not Found</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            The project you are trying to purchase doesn't exist.
          </p>
          <Link 
            to="/projects" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'upi',
      name: 'UPI Payment',
      icon: <Smartphone className="h-6 w-6" />,
      description: 'Pay using any UPI app like PhonePe, Google Pay, Paytm',
      enabled: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Pay securely with your card',
      enabled: false // Disabled for demo
    }
  ];

  const upiApps: UPIApp[] = [
    { id: 'phonepe', name: 'PhonePe', packageName: 'com.phonepe.app', icon: '📱' },
    { id: 'googlepay', name: 'Google Pay', packageName: 'com.google.android.apps.nbu.paisa.user', icon: '💳' },
    { id: 'paytm', name: 'Paytm', packageName: 'net.one97.paytm', icon: '💰' },
    { id: 'bhim', name: 'BHIM', packageName: 'in.org.npci.upiapp', icon: '🏦' },
    { id: 'amazonpay', name: 'Amazon Pay', packageName: 'in.amazon.mShop.android.shopping', icon: '🛒' }
  ];

  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(project.price);

  const generateTransactionId = () => {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  };

  const generateUPIUrl = (amount: number, transactionRef: string) => {
    const params = new URLSearchParams({
      pa: MERCHANT_UPI_ID,
      pn: MERCHANT_NAME,
      am: amount.toString(),
      cu: 'INR',
      tn: `Payment for ${project.title}`,
      tr: transactionRef
    });
    return `upi://pay?${params.toString()}`;
  };

  const generateQRCodeUrl = (upiUrl: string) => {
    // Using QR Server API to generate QR code
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
  };

  const openUPIApp = (packageName: string, upiUrl: string) => {
    // For mobile devices, try to open the specific UPI app
    if (/Android/i.test(navigator.userAgent)) {
      window.location.href = `intent://pay?${upiUrl.split('?')[1]}#Intent;scheme=upi;package=${packageName};end`;
    } else {
      // Fallback to generic UPI URL
      window.location.href = upiUrl;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !customerEmail || !customerPhone) {
      alert('Please fill in all required fields');
      return;
    }

    if (selectedPaymentMethod === 'upi' && !upiId && !selectedUpiApp) {
      alert('Please enter UPI ID or select a UPI app');
      return;
    }

    setIsProcessing(true);
    
    try {
      const txnId = generateTransactionId();
      setTransactionId(txnId);
      
      const upiUrl = generateUPIUrl(project.price, txnId);
      setPaymentUrl(upiUrl);
      setPaymentStatus('pending');
      setTimeRemaining(600); // Reset timer to 10 minutes
      
      // If UPI app is selected, try to open it
      if (selectedUpiApp) {
        const app = upiApps.find(a => a.id === selectedUpiApp);
        if (app) {
          openUPIApp(app.packageName, upiUrl);
        }
      }
      
      // Show QR code for scanning
      setShowQRCode(true);
      
      // Simulate payment verification (in real app, you'd poll your backend)
      setTimeout(async () => {
        // For demo purposes, randomly succeed or fail
        const success = Math.random() > 0.3; // 70% success rate
        
        if (success) {
          setPaymentStatus('success');
          
          try {
            // Add order to database (this will automatically trigger document email)
            await addOrder({
              projectId: project.id,
              projectTitle: project.title,
              customerName,
              customerEmail,
              price: project.price,
              status: 'completed'
            });
            
            // Send order confirmation email with download instructions
            const downloadInstructions = generateDownloadInstructions(project.title, txnId);
            await sendOrderConfirmation(
              {
                project_title: project.title,
                customer_name: customerName,
                price: formattedPrice,
                order_id: txnId,
                download_instructions: downloadInstructions
              },
              customerEmail
            );
          } catch (error) {
            console.error('Error processing order:', error);
            // Payment was successful but order processing failed
            // In a real app, you'd want to handle this more gracefully
          }
        } else {
          setPaymentStatus('failed');
        }
      }, 10000); // Simulate 10 second processing time
      
    } catch (error) {
      console.error('Payment initiation failed:', error);
      setPaymentStatus('failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setPaymentStatus('idle');
    setPaymentUrl('');
    setTransactionId('');
    setTimeRemaining(600);
    setShowQRCode(false);
  };

  const handleNewPurchase = () => {
    navigate('/projects');
  };

  // Get project documents count for display
  const projectDocuments = getProjectDocuments(project.id);
  const documentsCount = projectDocuments.length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16">
      <div className="container mx-auto px-4 md:px-6 max-w-4xl">
        {/* Back button */}
        <div className="mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-200 mb-4">Order Summary</h2>
              
              <div className="flex items-start space-x-4 mb-4">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-slate-200">{project.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{project.category}</p>
                </div>
              </div>
              
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Project Price</span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">{formattedPrice}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Processing Fee</span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">₹0</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-slate-900 dark:text-slate-200">Total</span>
                    <span className="text-lg font-semibold text-slate-900 dark:text-slate-200">{formattedPrice}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-300">
                    <p className="font-medium mb-1">Secure Payment</p>
                    <p>Your payment is protected by industry-standard encryption.</p>
                  </div>
                </div>
              </div>

              {/* Documents Info */}
              {documentsCount > 0 && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-start">
                    <FileText className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" />
                    <div className="text-sm text-green-800 dark:text-green-300">
                      <p className="font-medium mb-1">Project Documents Included</p>
                      <p>{documentsCount} documents across all review stages will be delivered via email.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
              {paymentStatus === 'idle' && (
                <>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200 mb-6">Checkout</h1>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Customer Information */}
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-4">Customer Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            id="name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                            required
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                          required
                        />
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          Project documents will be sent to this email address
                        </p>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-200 mb-4">Payment Method</h2>
                      <div className="space-y-3">
                        {paymentMethods.map((method) => (
                          <div
                            key={method.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors duration-200 ${
                              selectedPaymentMethod === method.id
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : method.enabled
                                  ? 'border-slate-300 dark:border-slate-700 hover:border-slate-400'
                                  : 'border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                            }`}
                            onClick={() => method.enabled && setSelectedPaymentMethod(method.id)}
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                id={method.id}
                                name="paymentMethod"
                                value={method.id}
                                checked={selectedPaymentMethod === method.id}
                                onChange={() => setSelectedPaymentMethod(method.id)}
                                disabled={!method.enabled}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="ml-3 flex items-center">
                                <div className="text-blue-600 dark:text-blue-400 mr-3">
                                  {method.icon}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-slate-200">
                                    {method.name}
                                    {!method.enabled && <span className="text-slate-500 ml-2">(Coming Soon)</span>}
                                  </div>
                                  <div className="text-sm text-slate-500 dark:text-slate-400">
                                    {method.description}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* UPI Payment Options */}
                    {selectedPaymentMethod === 'upi' && (
                      <div>
                        <h3 className="text-md font-medium text-slate-900 dark:text-slate-200 mb-4">UPI Payment Options</h3>
                        
                        {/* UPI Apps */}
                        <div className="mb-4">
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Pay with your favorite UPI app:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {upiApps.map((app) => (
                              <button
                                key={app.id}
                                type="button"
                                onClick={() => setSelectedUpiApp(selectedUpiApp === app.id ? '' : app.id)}
                                className={`p-3 border rounded-lg flex items-center space-x-2 transition-colors duration-200 ${
                                  selectedUpiApp === app.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400'
                                }`}
                              >
                                <span className="text-lg">{app.icon}</span>
                                <span className="text-sm font-medium text-slate-900 dark:text-slate-200">{app.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="text-center text-slate-500 dark:text-slate-400 my-4">OR</div>

                        {/* Manual UPI ID */}
                        <div>
                          <label htmlFor="upiId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Enter UPI ID manually
                          </label>
                          <input
                            type="text"
                            id="upiId"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="yourname@paytm"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200"
                          />
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                        isProcessing
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isProcessing ? 'Processing...' : `Pay ${formattedPrice}`}
                    </button>
                  </form>
                </>
              )}

              {/* Payment Pending */}
              {paymentStatus === 'pending' && (
                <div className="text-center">
                  <div className="mb-6">
                    <Clock className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-200 mb-2">Payment Pending</h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Complete your payment within {formatTime(timeRemaining)}
                    </p>
                  </div>

                  {showQRCode && paymentUrl && (
                    <div className="mb-6">
                      <div className="bg-white p-4 rounded-lg inline-block mb-4">
                        <img 
                          src={generateQRCodeUrl(paymentUrl)} 
                          alt="UPI QR Code"
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Scan this QR code with any UPI app to pay
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Transaction ID:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono text-slate-900 dark:text-slate-200">{transactionId}</span>
                        <button
                          onClick={() => copyToClipboard(transactionId)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Amount:</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-200">{formattedPrice}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Pay to:</span>
                      <span className="text-sm font-mono text-slate-900 dark:text-slate-200">{MERCHANT_UPI_ID}</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 mt-0.5" />
                      <div className="text-sm text-amber-800 dark:text-amber-300">
                        <p className="font-medium mb-1">Payment Instructions:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Open your UPI app and scan the QR code</li>
                          <li>Or use the transaction details above</li>
                          <li>Complete the payment within the time limit</li>
                          <li>Keep this page open until payment is confirmed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Success */}
              {paymentStatus === 'success' && (
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-200 mb-2">Payment Successful!</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    Thank you for your purchase. You'll receive emails with order confirmation and download links shortly.
                  </p>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6">
                    <div className="text-sm text-green-800 dark:text-green-300">
                      <p className="font-medium mb-2">Order Details:</p>
                      <p>Transaction ID: {transactionId}</p>
                      <p>Project: {project.title}</p>
                      <p>Amount: {formattedPrice}</p>
                      {documentsCount > 0 && (
                        <p className="mt-2 flex items-center justify-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {documentsCount} project documents will be delivered via email
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleNewPurchase}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Browse More Projects
                    </button>
                    <Link
                      to="/contact"
                      className="block w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 text-center"
                    >
                      Need Help?
                    </Link>
                  </div>
                </div>
              )}

              {/* Payment Failed */}
              {paymentStatus === 'failed' && (
                <div className="text-center">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-200 mb-2">Payment Failed</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {timeRemaining === 0 
                      ? 'Payment time expired. Please try again.'
                      : 'There was an issue processing your payment. Please try again.'
                    }
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleRetry}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      Try Again
                    </button>
                    <Link
                      to="/contact"
                      className="block w-full py-2 px-4 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200 text-center"
                    >
                      Contact Support
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;