import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { COMPANY_INFO, CSS_CLASSES } from '../constants';

const ContactUs = () => {
  const [isVisible, setIsVisible] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });

  useEffect(() => {
    document.title = 'Contact Us - PhysioWay | Get in Touch for Professional Physiotherapy';
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('[id]').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // You can add API call here when backend is ready
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      service: '',
      message: ''
    });
  };

  const contactMethods = [
    {
      title: 'Phone',
      value: COMPANY_INFO.phone,
      icon: '📞',
      description: '24/7 Emergency Support',
      action: `tel:${COMPANY_INFO.phone}`
    },
    {
      title: 'Email',
      value: COMPANY_INFO.email,
      icon: '✉️',
      description: 'Get a response within 24 hours',
      action: `mailto:${COMPANY_INFO.email}`
    },
    {
      title: 'Service Areas',
      value: COMPANY_INFO.serviceAreas.join(', '),
      icon: '📍',
      description: 'We serve these locations',
      action: null
    },
    {
      title: 'Working Hours',
      value: `${COMPANY_INFO.workingHours.weekdays}, ${COMPANY_INFO.workingHours.weekend}`,
      icon: '🕐',
      description: 'Our availability',
      action: null
    }
  ];

  const faqs = [
    {
      question: 'How quickly can I get an appointment?',
      answer: 'We typically schedule appointments within 24-48 hours. For emergency cases, we offer same-day service.'
    },
    {
      question: 'Do you accept insurance?',
      answer: 'Yes, we work with most major insurance providers. Please contact us to verify your specific coverage.'
    },
    {
      question: 'What equipment do you bring for home visits?',
      answer: 'Our therapists bring all necessary equipment including exercise tools, assessment devices, and treatment aids.'
    },
    {
      question: 'How long is each session?',
      answer: 'Standard sessions are 45-60 minutes, but duration may vary based on your specific treatment needs.'
    },
    {
      question: 'Can I reschedule my appointment?',
      answer: 'Yes, you can reschedule up to 4 hours before your appointment time through our app or by calling us.'
    },
    {
      question: 'Do you provide treatment reports?',
      answer: 'Yes, we provide detailed digital reports after each session and comprehensive progress reports monthly.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section id="hero" className="relative pt-20 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50"></div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-100/20 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className={`${isVisible.hero ? 'animate-fade-in' : 'opacity-0'}`}>
              <h1 className={CSS_CLASSES.heading.h1}>
                Get in <span className={CSS_CLASSES.heading.gradient}>Touch</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                Have questions about our services? Need to book an appointment? We're here to help you 
                start your journey to better health and recovery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section id="contact-methods" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactMethods.map((method, index) => (
              <div key={index} className={`${CSS_CLASSES.card.base} ${CSS_CLASSES.card.padding} text-center ${isVisible['contact-methods'] ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl flex items-center justify-center text-3xl">
                  {method.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                {method.action ? (
                  <a href={method.action} className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                    {method.value}
                  </a>
                ) : (
                  <p className="text-gray-800 font-medium">{method.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Emergency */}
      <section id="contact-form" className="py-20 bg-gradient-to-br from-gray-50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            {/* Contact Form */}
            <div className={`${isVisible['contact-form'] ? 'animate-slide-in-left' : 'opacity-0'}`}>
              <div className="bg-white rounded-3xl shadow-2xl p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                      Service Interested In
                    </label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="">Select a service</option>
                      <option value="orthopedic">Orthopedic Physiotherapy</option>
                      <option value="neurological">Neurological Physiotherapy</option>
                      <option value="cardiopulmonary">Cardiopulmonary Physiotherapy</option>
                      <option value="pediatric">Pediatric Physiotherapy</option>
                      <option value="geriatric">Geriatric Physiotherapy</option>
                      <option value="womens-health">Women's Health Physiotherapy</option>
                      <option value="general">General Consultation</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                      placeholder="Tell us about your condition or questions..."
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    className={`w-full ${CSS_CLASSES.button.primary} py-4 text-lg`}
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
            
            {/* Emergency & Info */}
            <div className={`mt-12 lg:mt-0 ${isVisible['contact-form'] ? 'animate-slide-in-right' : 'opacity-0'}`}>
              {/* Emergency Contact */}
              <div className="bg-red-50 border border-red-200 rounded-3xl p-8 mb-8">
                <h3 className="text-2xl font-bold text-red-800 mb-4 flex items-center">
                  <span className="mr-3">🚨</span>
                  Emergency Contact
                </h3>
                <p className="text-red-700 mb-6">
                  For urgent physiotherapy needs or medical emergencies, contact us immediately.
                </p>
                <a
                  href={`tel:${COMPANY_INFO.phone}`}
                  className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors duration-300"
                >
                  <span className="mr-2">📞</span>
                  Call {COMPANY_INFO.phone}
                </a>
              </div>
              
              {/* Quick Info */}
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Why Choose PhysioWay?</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-4">🏠</span>
                    <div>
                      <h4 className="font-semibold">Home Service</h4>
                      <p className="text-primary-100 text-sm">Professional treatment at your doorstep</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-4">⚡</span>
                    <div>
                      <h4 className="font-semibold">Quick Response</h4>
                      <p className="text-primary-100 text-sm">Same-day appointments available</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-4">👨‍⚕️</span>
                    <div>
                      <h4 className="font-semibold">Expert Team</h4>
                      <p className="text-primary-100 text-sm">Certified and experienced professionals</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl mr-4">📱</span>
                    <div>
                      <h4 className="font-semibold">Digital Tracking</h4>
                      <p className="text-primary-100 text-sm">Monitor your progress online</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-16 ${isVisible.faq ? 'animate-fade-in' : 'opacity-0'}`}>
            <h2 className={CSS_CLASSES.heading.h2}>
              Frequently Asked <span className={CSS_CLASSES.heading.gradient}>Questions</span>
            </h2>
            <p className="text-xl text-gray-600 mt-4">
              Get answers to common questions about our services
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className={`bg-gray-50 rounded-2xl p-6 ${isVisible.faq ? 'animate-slide-up' : 'opacity-0'}`} style={{ animationDelay: `${index * 0.1}s` }}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUs;
