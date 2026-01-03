import React from 'react';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  const lastUpdated = 'January 3, 2025';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Terms and Conditions</h1>
          <p className="text-gray-500 mt-2">Last updated: {lastUpdated}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 sm:p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction and Acceptance</h2>
            <p className="text-gray-700 leading-relaxed">
              Welcome to HealthyPhysio. These Terms and Conditions ("Terms") govern your use of our physiotherapy management platform, including our website, mobile applications, and related services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Service Description</h2>
            <p className="text-gray-700 mb-3">HealthyPhysio provides a digital platform that enables:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Patients to book and manage physiotherapy appointments</li>
              <li>Therapists to manage their schedules, patient records, and treatment plans</li>
              <li>Administrators to oversee operations, monitor safety, and manage staff</li>
              <li>Healthcare providers to collaborate on patient care</li>
            </ul>
            <p className="text-gray-700 mt-3">
              Our Service is a management platform and does not itself provide medical advice, diagnosis, or treatment. All physiotherapy services are provided by licensed healthcare professionals.
            </p>
          </section>

          {/* User Accounts */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
            <div className="text-gray-700 space-y-3">
              <p><strong>3.1 Registration:</strong> You must create an account to use certain features of our Service. You agree to provide accurate, current, and complete information during registration.</p>
              <p><strong>3.2 Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized access.</p>
              <p><strong>3.3 Account Types:</strong> Different user types (Patient, Therapist, Doctor, Administrator) have different access levels and responsibilities. You agree to use your account only for its intended purpose.</p>
              <p><strong>3.4 Account Approval:</strong> Therapist and doctor accounts require verification and approval before full access is granted. We reserve the right to reject or revoke access at our discretion.</p>
            </div>
          </section>

          {/* Patient Terms */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Patient Terms</h2>
            <div className="text-gray-700 space-y-3">
              <p><strong>4.1 Medical Information:</strong> You agree to provide accurate medical information necessary for your treatment. You understand that incomplete or inaccurate information may affect your care.</p>
              <p><strong>4.2 Appointments:</strong> You agree to attend scheduled appointments or provide reasonable notice for cancellations. Repeated no-shows may result in account restrictions.</p>
              <p><strong>4.3 Home Visits:</strong> For home-based treatments, you agree to provide a safe environment for therapist visits and accurate location information.</p>
              <p><strong>4.4 Payments:</strong> You are responsible for payment of services rendered. Payment terms will be communicated before treatment begins. Currently, we do not process online payments through this platform.</p>
            </div>
          </section>

          {/* Therapist Terms */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Therapist Terms</h2>
            <div className="text-gray-700 space-y-3">
              <p><strong>5.1 Qualifications:</strong> Therapists must maintain valid professional licenses and certifications as required by applicable laws and regulations.</p>
              <p><strong>5.2 Professional Conduct:</strong> Therapists agree to maintain professional standards of care and conduct in all patient interactions.</p>
              <p><strong>5.3 Documentation:</strong> Therapists are responsible for accurate and timely documentation of all patient interactions, treatments, and progress.</p>
              <p><strong>5.4 Location Sharing:</strong> During home visits, therapists may be required to share their location for safety monitoring purposes. This is a condition of providing home-based services.</p>
              <p><strong>5.5 Safety Protocol:</strong> Therapists agree to follow all safety protocols, including proximity monitoring during patient visits.</p>
            </div>
          </section>

          {/* Location Services */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-3">6. Location Services and Safety Monitoring</h2>
            <div className="text-blue-700 space-y-3">
              <p><strong>6.1 Purpose:</strong> Our location services are designed to ensure the safety of both patients and therapists during home visits and to verify service delivery.</p>
              <p><strong>6.2 Consent:</strong> Location data is collected only with explicit consent. See our <Link to="/privacy" className="underline">Privacy Policy</Link> for details.</p>
              <p><strong>6.3 Proximity Alerts:</strong> Our system monitors for unauthorized proximity between therapists and patients outside of scheduled appointments. This is a safety feature to protect all parties.</p>
              <p><strong>6.4 Data Usage:</strong> Location data is used solely for:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Verifying therapist attendance at scheduled appointments</li>
                <li>Safety monitoring during home visits</li>
                <li>Generating proximity alerts for administrator review</li>
              </ul>
              <p><strong>6.5 Opt-Out:</strong> You may opt out of location tracking, but this may limit certain features and home visit verification capabilities.</p>
            </div>
          </section>

          {/* Payment Terms */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Payment Terms</h2>
            <div className="text-gray-700 space-y-3">
              <p><strong>7.1 Service Fees:</strong> Fees for physiotherapy services are communicated before treatment and are subject to the fee schedule in effect at the time of service.</p>
              <p><strong>7.2 Payment Methods:</strong> Currently, payments are collected offline (cash, bank transfer, etc.). We do not process online payments through this platform at this time.</p>
              <p><strong>7.3 Payment Records:</strong> All payment records are maintained in the system for your reference. You can view your payment history through your dashboard.</p>
              <p><strong>7.4 Missed Sessions:</strong> You will not be charged for sessions that were not conducted. If a session is cancelled by the therapist or due to reassignment, no payment is required for that session.</p>
              <p><strong>7.5 Payment Reminders:</strong> You will receive payment reminders 7 days and 3 days before payment is due.</p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
            <p className="text-gray-700">
              All content, features, and functionality of the Service, including but not limited to text, graphics, logos, and software, are owned by HealthyPhysio and are protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without our express written permission.
            </p>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Prohibited Activities</h2>
            <p className="text-gray-700 mb-3">You agree not to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Share account credentials with unauthorized persons</li>
              <li>Submit false or misleading information</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Use the Service to collect personal information without consent</li>
              <li>Circumvent any security measures or safety features</li>
            </ul>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Disclaimer of Warranties</h2>
            <p className="text-gray-700">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE. WE ARE NOT RESPONSIBLE FOR THE QUALITY OF PHYSIOTHERAPY SERVICES PROVIDED BY THERAPISTS USING OUR PLATFORM.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
            <p className="text-gray-700">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, HEALTHYPHYSIO SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Indemnification</h2>
            <p className="text-gray-700">
              You agree to indemnify and hold harmless HealthyPhysio, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising out of your use of the Service, your violation of these Terms, or your violation of any rights of another.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Termination</h2>
            <div className="text-gray-700 space-y-3">
              <p><strong>13.1 By You:</strong> You may terminate your account at any time by contacting us. Upon termination, your right to use the Service will cease immediately.</p>
              <p><strong>13.2 By Us:</strong> We may suspend or terminate your account at any time for violation of these Terms, for prolonged inactivity, or for any other reason at our discretion.</p>
              <p><strong>13.3 Effect of Termination:</strong> Upon termination, we will retain your data as required by law and our Privacy Policy. Medical records will be retained as required by healthcare regulations.</p>
            </div>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Governing Law</h2>
            <p className="text-gray-700">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts of [Your Jurisdiction].
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. We will notify you of any material changes via email or through the Service. Your continued use of the Service after such changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">16. Severability</h2>
            <p className="text-gray-700">
              If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">17. Contact Information</h2>
            <div className="text-gray-700">
              <p>For questions about these Terms, please contact us:</p>
              <div className="mt-3 bg-gray-50 rounded-lg p-4">
                <p><strong>HealthyPhysio</strong></p>
                <p>Email: legal@healthyphysio.com</p>
                <p>Address: [Your Business Address]</p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>
          <span className="mx-2">|</span>
          <Link to="/" className="text-primary-600 hover:underline">Home</Link>
        </div>
      </main>
    </div>
  );
};

export default TermsAndConditions;
