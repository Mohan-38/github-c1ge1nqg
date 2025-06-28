import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, Linkedin, Github, Code } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white pt-12 pb-6">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Code className="h-6 w-6 text-blue-500" />
              <span className="text-xl font-bold">TechCreator</span>
            </div>
            <p className="text-slate-400 mb-4">
              Creating innovative technology solutions in IoT, blockchain, and web development.
              Available for custom projects and consultations.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-500 transition-colors duration-200"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-500 transition-colors duration-200"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className="text-slate-400 hover:text-blue-500 transition-colors duration-200"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/projects" 
                  className="text-slate-400 hover:text-blue-500 transition-colors duration-200"
                >
                  All Projects
                </Link>
              </li>
              <li>
                <Link 
                  to="/projects?category=iot" 
                  className="text-slate-400 hover:text-blue-500 transition-colors duration-200"
                >
                  IoT Projects
                </Link>
              </li>
              <li>
                <Link 
                  to="/projects?category=blockchain" 
                  className="text-slate-400 hover:text-blue-500 transition-colors duration-200"
                >
                  Blockchain Projects
                </Link>
              </li>
              <li>
                <Link 
                  to="/projects?category=web" 
                  className="text-slate-400 hover:text-blue-500 transition-colors duration-200"
                >
                  Web Development
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-slate-400 hover:text-blue-500 transition-colors duration-200"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
                <span className="text-slate-400">
                  <a 
                    href="mailto:mohanselemophile@gmail.com"
                    className="hover:text-blue-500 transition-colors duration-200"
                  >
                    mohanselemophile@gmail.com
                  </a>
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-blue-500 mt-0.5" />
                <span className="text-slate-400">Available upon request</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 mt-8 pt-6 text-center">
          <p className="text-slate-500 text-sm">
            &copy; {currentYear} TechCreator. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;