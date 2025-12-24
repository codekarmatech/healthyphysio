import React, { useState, useEffect } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/common/PageHeader';
import { getAllSettings } from '../services/siteSettingsService';
import { COMPANY_INFO } from '../constants';

const ContactUs = () => {
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getAllSettings();
      setSettings(data);
      document.title = `Contact Us - ${data?.branding?.company_name || 'PhysioWay'}`;
    };
    fetchSettings();
  }, []);

  const branding = settings?.branding || COMPANY_INFO;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
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
      value: branding.phone || COMPANY_INFO.phone,
      icon: '📞',
      description: '24/7 Emergency Support',
      action: `tel:${branding.phone || COMPANY_INFO.phone}`
    },
    {
      title: 'Email',
      value: branding.email || COMPANY_INFO.email,
      icon: '✉️',
      description: 'Get a response within 24 hours',
      action: `mailto:${branding.email || COMPANY_INFO.email}`
    },
    {
      title: 'Service Areas',
      value: (COMPANY_INFO.serviceAreas || []).join(', '),
      icon: '📍',
      description: 'We serve these locations',
      action: null
    },
    {
      title: 'Working Hours',
      value: COMPANY_INFO.workingHours ? `${COMPANY_INFO.workingHours.weekdays}, ${COMPANY_INFO.workingHours.weekend}` : 'Mon-Sat: 9am-8pm',
      icon: '🕐',
      description: 'Our availability',
      action: null
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <PageHeader
        title="Get in Touch"
        subtitle="Have questions about our services? Need to book an appointment? We're here to help."
        bgImage="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80"
      />

      {/* Contact Methods */}
      <section className="py-12 -mt-16 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <div key={index} className="glass-card p-6 rounded-2xl text-center hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 mx-auto mb-4 bg-brand-blue/10 rounded-full flex items-center justify-center text-2xl">
                  {method.icon}
                </div>
                <h3 className="text-lg font-bold text-brand-dark mb-1">{method.title}</h3>
                <p className="text-xs text-slate-500 mb-2">{method.description}</p>
                {method.action ? (
                  <a href={method.action} className="text-brand-blue font-semibold hover:text-brand-orange transition-colors truncate block">
                    {method.value}
                  </a>
                ) : (
                  <p className="text-slate-800 font-medium truncate">{method.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Emergency */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16">
            {/* Contact Form */}
            <div>
              <div className="glass-card p-8 rounded-3xl">
                <h2 className="text-3xl font-heading font-bold text-brand-dark mb-6">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                        placeholder="+91..."
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-slate-700 mb-2">Service Interested In</label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
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
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows="4"
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all resize-none"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20 transition-all"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>

            {/* Emergency & Info */}
            <div className="mt-12 lg:mt-0 space-y-8">
              {/* Emergency Contact */}
              <div className="bg-red-50/50 backdrop-blur-sm border border-red-100 rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-red-800 mb-4 flex items-center">
                  <span className="mr-3 text-3xl">🚨</span>
                  Emergency Support
                </h3>
                <p className="text-red-700/80 mb-6 leading-relaxed">
                  For urgent physiotherapy needs or immediate assistance, our emergency line is open 24/7.
                </p>
                <a
                  href={`tel:${branding.phone || COMPANY_INFO.phone}`}
                  className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                >
                  <span className="mr-2">📞</span>
                  Call {branding.phone || COMPANY_INFO.phone}
                </a>
              </div>

              {/* Quick Info */}
              <div className="bg-brand-dark rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-heading font-bold mb-6">Why Choose PhysioWay?</h3>
                  <div className="space-y-6">
                    {[
                      { icon: '🏠', title: 'Home Service', desc: 'Professional treatment at your doorstep' },
                      { icon: '⚡', title: 'Quick Response', desc: 'Same-day appointments available' },
                      { icon: '👨‍⚕️', title: 'Expert Team', desc: 'Certified and experienced professionals' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center">
                        <span className="text-2xl mr-4 bg-white/10 w-10 h-10 flex items-center justify-center rounded-lg">{item.icon}</span>
                        <div>
                          <h4 className="font-bold text-white">{item.title}</h4>
                          <p className="text-slate-400 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-heading font-bold text-brand-dark">Common Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              { q: 'How quickly can I get an appointment?', a: 'We typically schedule appointments within 24-48 hours. For emergency cases, we offer same-day service.' },
              { q: 'Do you accept insurance?', a: 'Yes, we work with most major insurance providers. Please contact us to verify your specific coverage.' },
              { q: 'What equipment do you bring?', a: 'Our therapists bring all necessary equipment including exercise tools, assessment devices, and treatment aids.' }
            ].map((faq, index) => (
              <div key={index} className="glass-panel p-6 rounded-2xl hover:bg-slate-50 transition-colors">
                <h3 className="text-lg font-bold text-brand-dark mb-2">{faq.q}</h3>
                <p className="text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer branding={branding} />
    </div>
  );
};

export default ContactUs;
