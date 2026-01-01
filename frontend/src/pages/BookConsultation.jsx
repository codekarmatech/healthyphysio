import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/common/PageHeader';
import { getAllSettings } from '../services/siteSettingsService';
import { SERVICES, COMPANY_INFO } from '../constants';

const BookConsultation = () => {
  const [settings, setSettings] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    age: '',
    gender: '',

    // Address Information
    address: '',
    city: '',
    state: '',
    pincode: '',

    // Medical Information
    serviceType: '',
    condition: '',
    symptoms: '',
    medicalHistory: '',
    currentMedications: '',
    previousPhysiotherapy: '',

    // Appointment Preferences
    preferredDate: '',
    preferredTime: '',
    urgency: 'normal',

    // Additional Information
    additionalNotes: '',
    emergencyContact: '',
    emergencyPhone: '',

    // Consent
    termsAccepted: false,
    privacyAccepted: false
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getAllSettings();
      setSettings(data);
      document.title = `Book Free Consultation - ${data?.branding?.company_name || 'PhysioWay'}`;
    };
    fetchSettings();
  }, []);

  const branding = settings?.branding || COMPANY_INFO;
  const services = settings?.services || [];
  const pageSettings = settings?.page_settings?.book || {};

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Consultation booking:', formData);
    alert('Thank you! Your consultation request has been submitted. We will contact you within 24 hours to confirm your appointment.');
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: '👤' },
    { number: 2, title: 'Medical Details', icon: '🏥' },
    { number: 3, title: 'Preferences', icon: '📅' },
    { number: 4, title: 'Confirmation', icon: '✅' }
  ];

  const serviceOptions = SERVICES.main.map(service => ({
    value: service.id,
    label: service.title
  }));

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <PageHeader
        title={pageSettings.hero_title || "Book Free Consultation"}
        subtitle={pageSettings.hero_subtitle || "Take the first step towards better health. Our expert physiotherapists will assess your condition and create a personalized treatment plan."}
        bgImage={pageSettings.hero_background_image_url || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80"}
      />

      {/* Progress Steps */}
      <section className="py-8 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-16 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 transition-all duration-300 ${currentStep >= step.number
                    ? 'bg-brand-blue border-brand-blue text-white shadow-lg shadow-brand-blue/30'
                    : 'border-slate-300 text-slate-400 bg-white'
                  }`}>
                  <span className="text-lg lg:text-xl">{step.icon}</span>
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className={`text-sm font-bold ${currentStep >= step.number ? 'text-brand-blue' : 'text-slate-400'
                    }`}>
                    Step {step.number}
                  </div>
                  <div className={`text-xs ${currentStep >= step.number ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 lg:w-16 h-0.5 mx-2 lg:mx-4 ${currentStep > step.number ? 'bg-brand-blue' : 'bg-slate-300'
                    }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 lg:p-10">

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-heading font-bold text-brand-dark mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                      placeholder="Enter your last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Age *</label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="120"
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                      placeholder="Enter your age"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <h3 className="text-xl font-heading font-bold text-brand-dark mt-8 mb-4">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all resize-none"
                      placeholder="Enter your complete address"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                      placeholder="Enter your city"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                      placeholder="Enter your state"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Medical Information */}
            {currentStep === 2 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-heading font-bold text-brand-dark mb-6">Medical Information</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Service Type *</label>
                    <select
                      name="serviceType"
                      value={formData.serviceType}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                    >
                      <option value="">Select service type</option>
                      {serviceOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Primary Condition/Concern *</label>
                    <input
                      type="text"
                      name="condition"
                      value={formData.condition}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                      placeholder="e.g., Lower back pain, Knee injury, Stroke recovery"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Current Symptoms</label>
                    <textarea
                      name="symptoms"
                      value={formData.symptoms}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all resize-none"
                      placeholder="Describe your current symptoms, pain level, limitations..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Medical History</label>
                    <textarea
                      name="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all resize-none"
                      placeholder="Previous surgeries, chronic conditions, injuries..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Current Medications</label>
                    <textarea
                      name="currentMedications"
                      value={formData.currentMedications}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all resize-none"
                      placeholder="List any medications you're currently taking..."
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Previous Physiotherapy Experience</label>
                    <select
                      name="previousPhysiotherapy"
                      value={formData.previousPhysiotherapy}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                    >
                      <option value="">Select option</option>
                      <option value="none">No previous experience</option>
                      <option value="clinic">Clinic-based physiotherapy</option>
                      <option value="home">Home-based physiotherapy</option>
                      <option value="hospital">Hospital physiotherapy</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Appointment Preferences */}
            {currentStep === 3 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-heading font-bold text-brand-dark mb-6">Appointment Preferences</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Date *</label>
                      <input
                        type="date"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleInputChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Time *</label>
                      <select
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                      >
                        <option value="">Select time slot</option>
                        {timeSlots.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Urgency Level</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { value: 'normal', label: 'Normal', desc: 'Within 3-5 days', color: 'green' },
                        { value: 'urgent', label: 'Urgent', desc: 'Within 24-48 hours', color: 'yellow' },
                        { value: 'emergency', label: 'Emergency', desc: 'Same day if possible', color: 'red' }
                      ].map(option => (
                        <label key={option.value} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${formData.urgency === option.value
                            ? `border-${option.color}-500 bg-${option.color}-50 ring-2 ring-${option.color}-500/20`
                            : 'border-slate-200 hover:border-slate-300 bg-white/50'
                          }`}>
                          <input
                            type="radio"
                            name="urgency"
                            value={option.value}
                            checked={formData.urgency === option.value}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{option.label}</div>
                            <div className="text-xs text-slate-600">{option.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Emergency Contact Name</label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                        placeholder="Emergency contact person"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Emergency Contact Phone</label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Additional Notes</label>
                    <textarea
                      name="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-blue/50 outline-none transition-all resize-none"
                      placeholder="Any additional information you'd like us to know..."
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-heading font-bold text-brand-dark mb-6">Confirmation</h2>

                <div className="bg-slate-50/80 rounded-2xl p-6 mb-8 border border-slate-100">
                  <h3 className="text-lg font-semibold text-brand-dark mb-4">Booking Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                    <div><strong className="text-slate-900">Name:</strong> {formData.firstName} {formData.lastName}</div>
                    <div><strong className="text-slate-900">Phone:</strong> {formData.phone}</div>
                    <div><strong className="text-slate-900">Service:</strong> {serviceOptions.find(s => s.value === formData.serviceType)?.label || 'Not selected'}</div>
                    <div><strong className="text-slate-900">Condition:</strong> {formData.condition}</div>
                    <div><strong className="text-slate-900">Date:</strong> {formData.preferredDate}</div>
                    <div><strong className="text-slate-900">Time:</strong> {formData.preferredTime}</div>
                    <div><strong className="text-slate-900">Urgency:</strong> {formData.urgency}</div>
                    <div><strong className="text-slate-900">City:</strong> {formData.city}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleInputChange}
                      required
                      className="mt-1 mr-3 h-5 w-5 text-brand-blue focus:ring-brand-blue border-gray-300 rounded"
                    />
                    <span className="text-sm text-slate-600">
                      I agree to the <Link to="/terms" className="text-brand-blue hover:text-brand-orange">Terms of Service</Link> and understand that this is a free consultation.
                    </span>
                  </label>

                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      name="privacyAccepted"
                      checked={formData.privacyAccepted}
                      onChange={handleInputChange}
                      required
                      className="mt-1 mr-3 h-5 w-5 text-brand-blue focus:ring-brand-blue border-gray-300 rounded"
                    />
                    <span className="text-sm text-slate-600">
                      I consent to PhysioWay collecting and processing my personal and medical information for the purpose of providing physiotherapy services as outlined in the <Link to="/privacy" className="text-brand-blue hover:text-brand-orange">Privacy Policy</Link>.
                    </span>
                  </label>
                </div>

                <div className="mt-8 p-6 bg-brand-blue/5 border border-brand-blue/10 rounded-2xl">
                  <h4 className="font-bold text-brand-blue mb-2">What happens next?</h4>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Our team will review your information within 2-4 hours</li>
                    <li>• We'll call you to confirm the appointment details</li>
                    <li>• A certified physiotherapist will visit you at the scheduled time</li>
                    <li>• The consultation includes assessment and treatment recommendations</li>
                    <li>• You'll receive a detailed report and treatment plan</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${currentStep === 1
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
              >
                ← Previous
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 shadow-lg shadow-brand-blue/20 transition-all"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!formData.termsAccepted || !formData.privacyAccepted}
                  className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${formData.termsAccepted && formData.privacyAccepted
                      ? 'bg-brand-orange text-white hover:bg-brand-orange/90 shadow-brand-orange/20'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    }`}
                >
                  Book Free Consultation
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="py-12 bg-red-50/50 border-t border-red-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xl font-bold text-red-800 mb-4">Need Immediate Assistance?</h3>
          <p className="text-red-700/80 mb-6">
            For urgent medical situations or same-day appointments, call us directly.
          </p>
          <a
            href={`tel:${branding.phone || COMPANY_INFO.phone}`}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
          >
            <span className="mr-2">📞</span>
            Call {branding.phone || COMPANY_INFO.phone}
          </a>
        </div>
      </section>

      <Footer branding={branding} services={services} />
    </div>
  );
};

export default BookConsultation;
