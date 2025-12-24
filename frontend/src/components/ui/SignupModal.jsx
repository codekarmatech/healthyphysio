import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { COMPANY_INFO } from '../../constants';

const SignupModal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolledToFooter, setHasScrolledToFooter] = useState(false);
  const [timeoutCompleted, setTimeoutCompleted] = useState(false);

  useEffect(() => {
    // Set timeout for 5 seconds
    const timer = setTimeout(() => {
      setTimeoutCompleted(true);
    }, 5000);

    // Scroll listener
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      if (footer) {
        const footerTop = footer.offsetTop;
        const scrollPosition = window.scrollY + window.innerHeight;
        
        if (scrollPosition >= footerTop) {
          setHasScrolledToFooter(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Show modal when both conditions are met
    if (timeoutCompleted && hasScrolledToFooter && !localStorage.getItem('signupModalDismissed')) {
      setIsVisible(true);
    }
  }, [timeoutCompleted, hasScrolledToFooter]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('signupModalDismissed', 'true');
  };

  const handleSignup = () => {
    localStorage.setItem('signupModalDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-scale-in">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors duration-300"
        >
          <span className="text-gray-600">✕</span>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎉</span>
          </div>

          {/* Heading */}
          <h3 className="font-display text-2xl font-bold text-gray-900 mb-4">
            Ready to Start Your 
            <span className="block bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
              Healing Journey?
            </span>
          </h3>

          {/* Description */}
          <p className="font-sans text-gray-600 mb-8 leading-relaxed">
            Join thousands of patients who've transformed their lives with PhysioWay. 
            Get personalized care from certified professionals.
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-8 text-left">
            {[
              'Free consultation with expert physiotherapists',
              'Personalized treatment plans at home',
              'Insurance support and flexible payments',
              '24/7 emergency support available'
            ].map((benefit, index) => (
              <div key={index} className="flex items-center">
                <span className="text-green-500 mr-3">✓</span>
                <span className="font-sans text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <Link
              to="/register"
              onClick={handleSignup}
              className="block w-full py-4 bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-heading font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Start Free Consultation
            </Link>
            
            <button
              onClick={handleClose}
              className="block w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors duration-300"
            >
              Maybe Later
            </button>
          </div>

          {/* Contact Info */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Need immediate help?</p>
            <a 
              href={`tel:${COMPANY_INFO.phone}`}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              📞 {COMPANY_INFO.phone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupModal;
