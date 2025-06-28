import React, { useState } from 'react';
import { Mail, Linkedin, Github, SendHorizonal, CheckCircle } from 'lucide-react';
import { useProjects } from '../context/ProjectContext';
import { sendContactForm } from '../utils/email';

const ContactPage = () => {
  const { addInquiry, addProjectRequest } = useProjects();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [projectType, setProjectType] = useState('');
  const [budget, setBudget] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [message, setMessage] = useState('');
  const [requirements, setRequirements] = useState('');
  const [timeline, setTimeline] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Send email using EmailJS
      await sendContactForm({
        from_name: name,
        from_email: email,
        project_type: projectType,
        budget,
        message: `${message}\n\nProject Title: ${projectTitle}\nRequirements: ${requirements}\nTimeline: ${timeline}\nPriority: ${priority}`
      });
      
      // Add the inquiry to the context (legacy support)
      addInquiry({
        name,
        email,
        projectType,
        budget,
        message
      });

      // Add as a project request (new system)
      if (projectTitle.trim()) {
        await addProjectRequest({
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          project_title: projectTitle,
          project_type: projectType,
          budget_range: budget,
          description: message,
          requirements: requirements || undefined,
          timeline: timeline || undefined,
          priority,
          admin_notes: '',
          estimated_price: undefined,
          estimated_timeline: undefined,
          assigned_to: undefined
        });
      }
      
      setShowSuccess(true);
      
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setProjectType('');
      setBudget('');
      setProjectTitle('');
      setMessage('');
      setRequirements('');
      setTimeline('');
      setPriority('medium');
      
      // Hide success message after a delay
      setTimeout(() => {
        setShowSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Failed to send inquiry:', error);
      alert('Failed to send your request. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-16 text-slate-900 dark:text-slate-200">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Get In Touch</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Have a project idea or need a custom solution? Fill out the form below and I'll get back to you as soon as possible.
          </p>
        </div>
        
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3">
                {/* Contact Info */}
                <div className="bg-blue-600 text-white p-8">
                <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Mail className="h-6 w-6 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a 
                        href="mailto:mohanselemophile@gmail.com" 
                        className="text-blue-200 hover:text-white transition-colors duration-200"
                      >
                        mohanselemophile@gmail.com
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Github className="h-6 w-6 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">GitHub</p>
                      <a 
                        href="https://github.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-200 hover:text-white transition-colors duration-200"
                      >
                        github.com/techcreator
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Linkedin className="h-6 w-6 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium">LinkedIn</p>
                      <a 
                        href="https://linkedin.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-200 hover:text-white transition-colors duration-200"
                      >
                        linkedin.com/in/techcreator
                      </a>
                    </div>
                  </div>
                </div>
                
                <div className="mt-12">
                  <h3 className="font-medium mb-2">Expertise Areas</h3>
                  <ul className="list-disc list-inside space-y-1 text-blue-200">
                    <li>IoT Solutions</li>
                    <li>Blockchain Development</li>
                    <li>Web Applications</li>
                    <li>Mobile Apps</li>
                    <li>Custom Software</li>
                  </ul>
                </div>
              </div>
              
              {/* Contact Form */}
              <div className="col-span-2 p-8">
                <h2 className="text-xl font-semibold text-slate-900 mb-6">Send a Project Request</h2>
                
                {showSuccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-green-800 mb-2">Request Sent Successfully!</h3>
                    <p className="text-green-600">
                      Thank you for reaching out. Your project request has been submitted and I'll get back to you as soon as possible.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          id="contact-name"
                          name="contact-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="contact-email"
                          name="contact-email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="contact-phone"
                          name="contact-phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                        />
                      </div>

                      <div>
                        <label htmlFor="project-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Project Type *
                        </label>
                        <select
                          id="project-type"
                          name="project-type"
                          value={projectType}
                          onChange={(e) => setProjectType(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                          required
                        >
                          <option value="">Select project type</option>
                          <option value="IoT">IoT Solution</option>
                          <option value="Blockchain">Blockchain Development</option>
                          <option value="Web">Web Development</option>
                          <option value="Mobile">Mobile App</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="project-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Project Title *
                      </label>
                      <input
                        type="text"
                        id="project-title"
                        name="project-title"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                        placeholder="Give your project a descriptive title"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="budget-range" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Budget Range *
                        </label>
                        <select
                          id="budget-range"
                          name="budget-range"
                          value={budget}
                          onChange={(e) => setBudget(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                          required
                        >
                          <option value="">Select budget range</option>
                          <option value="₹5,000-₹10,000">₹5,000 - ₹10,000</option>
                          <option value="₹10,000-₹15,000">₹10,000 - ₹15,000</option>
                          <option value="₹15,000-₹20,000">₹15,000 - ₹20,000</option>
                          <option value="₹20,000-₹25,000">₹20,000 - ₹25,000</option>
                          <option value="₹25,000+">₹25,000+</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Priority Level
                        </label>
                        <select
                          id="priority"
                          name="priority"
                          value={priority}
                          onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="project-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Project Description *
                      </label>
                      <textarea
                        id="project-description"
                        name="project-description"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                        placeholder="Describe your project goals, target audience, and key features..."
                        required
                      ></textarea>
                    </div>

                    <div>
                      <label htmlFor="requirements" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Technical Requirements
                      </label>
                      <textarea
                        id="requirements"
                        name="requirements"
                        value={requirements}
                        onChange={(e) => setRequirements(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                        placeholder="Specific technologies, integrations, or technical requirements..."
                      ></textarea>
                    </div>

                    <div>
                      <label htmlFor="timeline" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Expected Timeline
                      </label>
                      <input
                        type="text"
                        id="timeline"
                        name="timeline"
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                        placeholder="e.g., 2-3 weeks, 1 month, ASAP"
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className={`inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 transition-colors duration-200 ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                            <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Project Request
                          <SendHorizonal className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;