import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  const lastUpdated = 'January 3, 2025';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link to="/" className="text-primary-600 hover:text-primary-700 text-sm">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Privacy Policy</h1>
          <p className="text-gray-500 mt-2">Last updated: {lastUpdated}</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 sm:p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              HealthyPhysio ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our physiotherapy management platform, in compliance with the General Data Protection Regulation (GDPR), Health Insurance Portability and Accountability Act (HIPAA), and other applicable data protection laws.
            </p>
          </section>

          {/* Data Controller */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Data Controller</h2>
            <p className="text-gray-700 leading-relaxed">
              HealthyPhysio acts as the data controller for the personal data processed through our platform. For any questions regarding your data, please contact our Data Protection Officer at privacy@healthyphysio.com.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800">3.1 Personal Information</h3>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>Full name, email address, phone number</li>
                  <li>Date of birth, gender</li>
                  <li>Emergency contact information</li>
                  <li>Profile photographs (optional)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800">3.2 Health Information (Special Category Data)</h3>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>Medical history and conditions</li>
                  <li>Treatment plans and progress notes</li>
                  <li>Assessment reports and diagnoses</li>
                  <li>Physiotherapy session records</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800">3.3 Location Data</h3>
                <p className="text-blue-700 mt-2">
                  <strong>With your explicit consent</strong>, we collect precise location data (GPS coordinates) for the following purposes:
                </p>
                <ul className="list-disc list-inside text-blue-700 mt-2 space-y-1">
                  <li><strong>Patient Treatment Location:</strong> To record the location where home-based physiotherapy treatments are conducted</li>
                  <li><strong>Therapist Visit Tracking:</strong> To verify therapist attendance at patient locations</li>
                  <li><strong>Safety Monitoring:</strong> To ensure the safety of both patients and therapists during home visits</li>
                  <li><strong>Proximity Alerts:</strong> To alert administrators if a therapist is near a patient's location outside of scheduled appointment times (safety feature)</li>
                </ul>
                <p className="text-blue-700 mt-3 text-sm">
                  <strong>Important:</strong> Location data collection is entirely optional. You can use our services without sharing location data, though some features (like home visit verification) may be limited.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-gray-800">3.4 Technical Data</h3>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Usage patterns and preferences</li>
                  <li>Login timestamps and session data</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Legal Basis for Processing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Legal Basis for Processing</h2>
            <p className="text-gray-700 mb-3">We process your personal data based on the following legal grounds:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Consent:</strong> For location data collection and marketing communications</li>
              <li><strong>Contract Performance:</strong> To provide our physiotherapy management services</li>
              <li><strong>Legal Obligation:</strong> To comply with healthcare regulations and maintain medical records</li>
              <li><strong>Vital Interests:</strong> In emergency situations affecting your health</li>
              <li><strong>Legitimate Interests:</strong> For fraud prevention, security, and service improvement</li>
            </ul>
          </section>

          {/* Location Data Consent */}
          <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-3">5. Location Data - Your Consent Rights</h2>
            <div className="text-yellow-700 space-y-3">
              <p>
                We only collect location data with your <strong>explicit, informed consent</strong>. Before collecting any location data, we will:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Clearly explain why we need your location</li>
                <li>Ask for your permission through your device's location settings</li>
                <li>Provide an in-app consent mechanism with clear opt-in/opt-out options</li>
              </ul>
              <p className="mt-3">
                <strong>You can withdraw consent at any time</strong> by:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Disabling location permissions in your device settings</li>
                <li>Adjusting your preferences in your account settings</li>
                <li>Contacting us at privacy@healthyphysio.com</li>
              </ul>
              <p className="mt-3 text-sm">
                Note: Withdrawing consent will not affect the lawfulness of processing based on consent before its withdrawal.
              </p>
            </div>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>To provide and manage physiotherapy services</li>
              <li>To schedule and track appointments</li>
              <li>To maintain treatment records and progress tracking</li>
              <li>To verify home visit attendance (with location consent)</li>
              <li>To ensure safety during home visits through proximity monitoring</li>
              <li>To generate reports for healthcare providers</li>
              <li>To process payments and billing</li>
              <li>To communicate service updates and reminders</li>
              <li>To improve our services and user experience</li>
              <li>To comply with legal and regulatory requirements</li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <div className="text-gray-700 space-y-3">
              <p>We retain your data for the following periods:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Medical Records:</strong> 7 years after last treatment (as required by healthcare regulations)</li>
                <li><strong>Location Data:</strong> 90 days, then automatically deleted or anonymized</li>
                <li><strong>Account Data:</strong> Until account deletion request plus 30 days</li>
                <li><strong>Audit Logs:</strong> 3 years for compliance purposes</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights Under GDPR</h2>
            <p className="text-gray-700 mb-3">You have the following rights regarding your personal data:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
            <p className="text-gray-700 mt-3">
              To exercise any of these rights, please contact us at privacy@healthyphysio.com. We will respond within 30 days.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Data Security</h2>
            <p className="text-gray-700 mb-3">We implement robust security measures including:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>End-to-end encryption for data in transit (TLS 1.3)</li>
              <li>Encryption at rest for stored data (AES-256)</li>
              <li>Role-based access controls</li>
              <li>Regular security audits and penetration testing</li>
              <li>Comprehensive audit logging for compliance</li>
              <li>Multi-factor authentication options</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-3">We may share your data with:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Healthcare Providers:</strong> Doctors, therapists, and other medical professionals involved in your care</li>
              <li><strong>Service Providers:</strong> Cloud hosting, payment processors (with appropriate data processing agreements)</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect vital interests</li>
            </ul>
            <p className="text-gray-700 mt-3">
              We do <strong>not</strong> sell your personal data to third parties.
            </p>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. International Data Transfers</h2>
            <p className="text-gray-700">
              If we transfer your data outside the European Economic Area (EEA), we ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the European Commission.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Cookies and Tracking</h2>
            <p className="text-gray-700">
              We use essential cookies to provide our services and optional analytics cookies to improve user experience. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy periodically. We will notify you of any material changes via email or through our platform. Continued use of our services after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Contact Us</h2>
            <div className="text-gray-700">
              <p>For any privacy-related questions or to exercise your rights, please contact:</p>
              <div className="mt-3 bg-gray-50 rounded-lg p-4">
                <p><strong>Data Protection Officer</strong></p>
                <p>Email: privacy@healthyphysio.com</p>
                <p>Address: [Your Business Address]</p>
              </div>
              <p className="mt-3">
                You also have the right to lodge a complaint with your local data protection authority if you believe your data protection rights have been violated.
              </p>
            </div>
          </section>

        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <Link to="/terms" className="text-primary-600 hover:underline">Terms and Conditions</Link>
          <span className="mx-2">|</span>
          <Link to="/" className="text-primary-600 hover:underline">Home</Link>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
