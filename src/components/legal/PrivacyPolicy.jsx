import React from 'react';
import { Card } from '../ui/card';

const PrivacyPolicy = () => {
  const lastUpdated = "September 20, 2025";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="mt-2 text-gray-600">Last updated: {lastUpdated}</p>
      </div>

      <Card className="p-8">
        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to TRVL Social ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our travel social platform.
            </p>
            <p className="mb-4">
              We comply with the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and other applicable privacy laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium mb-3">2.1 Personal Information</h3>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Account information (name, email, profile picture)</li>
              <li><strong>Age verification data (date of birth, age calculation)</strong></li>
              <li>Travel preferences and personality assessment data</li>
              <li>Booking and payment information</li>
              <li>Location data (with your consent)</li>
              <li>Communication and messages within the platform</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.2 Usage Information</h3>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Pages visited and features used</li>
              <li>Search queries and filters applied</li>
              <li>Device information and browser type</li>
              <li>IP address and general location</li>
              <li>Performance and error data</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">2.3 Cookies and Tracking</h3>
            <p className="mb-4">
              We use cookies and similar technologies based on your consent preferences:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>Essential:</strong> Required for basic functionality and security</li>
              <li><strong>Analytics:</strong> Help us understand usage patterns and improve performance</li>
              <li><strong>Marketing:</strong> Personalize content and advertisements</li>
              <li><strong>Functional:</strong> Remember your preferences and enhance features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>

            <h3 className="text-xl font-medium mb-3">3.1 Service Provision</h3>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Create and manage your account</li>
              <li>Process bookings and payments</li>
              <li>Provide customer support</li>
              <li>Facilitate group formation and communication</li>
              <li>Generate travel recommendations</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">3.2 Improvement and Analytics</h3>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Analyze usage patterns to improve our service</li>
              <li>Monitor performance and fix bugs</li>
              <li>Conduct A/B testing for new features</li>
              <li>Generate anonymized insights and reports</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">3.3 Communication</h3>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Send service-related notifications</li>
              <li>Share important updates and policy changes</li>
              <li>Marketing communications (with consent)</li>
              <li>Customer support responses</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Legal Basis for Processing</h2>
            <p className="mb-4">We process your data based on:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>Contract:</strong> To provide our services and fulfill our obligations</li>
              <li><strong>Consent:</strong> For marketing, analytics, and optional features</li>
              <li><strong>Legitimate Interest:</strong> For security, fraud prevention, and service improvement</li>
              <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing and Disclosure</h2>

            <h3 className="text-xl font-medium mb-3">5.1 Service Providers</h3>
            <p className="mb-4">We share data with trusted third-party providers:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Cloud hosting and database services (Supabase)</li>
              <li>Analytics platforms (Mixpanel, Datadog)</li>
              <li>Error monitoring services (Sentry)</li>
              <li>Payment processors (Stripe)</li>
              <li>Email communication services (Resend)</li>
              <li>Maps and location services (Mapbox)</li>
              <li>Performance monitoring and optimization</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">5.2 Business Partners</h3>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Travel vendors and experience providers</li>
              <li>Travel booking platforms and aggregators</li>
              <li>Maps and location services</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">5.3 Legal Requirements</h3>
            <p className="mb-4">
              We may disclose information when required by law, court order, or to protect our rights and safety.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights and Choices</h2>

            <h3 className="text-xl font-medium mb-3">6.1 GDPR Rights (EU Residents)</h3>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li><strong>Erasure:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong>Restriction:</strong> Limit how we process your data</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw Consent:</strong> Revoke consent for specific processing</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">6.2 CCPA Rights (California Residents)</h3>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Know what personal information is collected</li>
              <li>Know whether personal information is sold or disclosed</li>
              <li>Opt-out of the sale of personal information</li>
              <li>Access personal information</li>
              <li>Delete personal information</li>
              <li>Equal service and price, even if you exercise your privacy rights</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">6.3 Cookie Management</h3>
            <p className="mb-4">
              You can manage your cookie preferences through our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Preference Center</a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Security</h2>
            <p className="mb-4">We implement appropriate security measures including:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Encryption in transit and at rest</li>
              <li>Access controls and authentication</li>
              <li>Regular security audits and monitoring</li>
              <li>Incident response procedures</li>
              <li>Staff training on data protection</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
            <p className="mb-4">We retain your data according to these policies:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>Account Data:</strong> Duration of your account plus 6 years for legal obligations</li>
              <li><strong>Analytics Data:</strong> 24 months from collection</li>
              <li><strong>Marketing Data:</strong> 12 months from last interaction</li>
              <li><strong>Consent Records:</strong> 7 years for compliance purposes</li>
              <li><strong>Financial Records:</strong> 7 years for regulatory compliance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. International Transfers</h2>
            <p className="mb-4">
              Your data may be transferred to countries outside your region. We ensure adequate protection through:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Adequacy decisions by regulatory authorities</li>
              <li>Standard Contractual Clauses (SCCs)</li>
              <li>Privacy Shield certification (where applicable)</li>
              <li>Other appropriate safeguards</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy and COPPA Compliance</h2>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200">Age Verification Requirements</h3>
              <p className="mb-3">
                TRVL Social requires all users to be at least 13 years of age. We comply with the Children's Online Privacy Protection Act (COPPA) and implement strict age verification measures.
              </p>
            </div>

            <h3 className="text-xl font-medium mb-3">10.1 Age Verification Data Collection</h3>
            <p className="mb-4">To verify age compliance, we collect and process the following information:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>Date of Birth:</strong> Required during registration to verify minimum age requirement</li>
              <li><strong>Age Calculation Data:</strong> Automatically calculated from provided birth date</li>
              <li><strong>Verification Timestamps:</strong> When age verification was completed</li>
              <li><strong>IP Address:</strong> For location-based age verification requirements</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">10.2 How Age Verification Data is Protected</h3>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Birth dates are encrypted both in transit and at rest</li>
              <li>Access to age verification data is restricted to authorized personnel only</li>
              <li>Age verification data is never shared with third parties except as required by law</li>
              <li>Regular audits ensure proper handling of age-related information</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">10.3 COPPA Compliance Measures</h3>
            <p className="mb-4">
              We do not knowingly collect personal information from children under 13. Our compliance measures include:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Mandatory age verification during account registration</li>
              <li>Immediate account suspension for users found to be under 13</li>
              <li>Automatic deletion of data for verified underage accounts</li>
              <li>Regular monitoring and auditing of age verification systems</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">10.4 Parental Rights and Contact</h3>
            <p className="mb-4">
              If you are a parent or guardian and believe your child under 13 has created an account or provided personal information to us:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Contact us immediately at <a
                href="mailto:privacy@trvlsocial.com"
                className="text-blue-600 hover:underline underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                privacy@trvlsocial.com
              </a></li>
              <li>We will investigate and take appropriate action within 24 hours</li>
              <li>We will permanently delete all associated data if the account is confirmed to belong to a child under 13</li>
              <li>No fees will be charged for reasonable requests related to children's privacy</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">10.5 Data Deletion for Underage Users</h3>
            <p className="mb-4">
              When we become aware that we have collected information from a child under 13, we will:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Immediately suspend the account to prevent further data collection</li>
              <li>Delete all personal information associated with the account within 30 days</li>
              <li>Remove all user-generated content, including posts, messages, and profile information</li>
              <li>Notify the parent or guardian (if contact information is available) of the deletion</li>
              <li>Maintain deletion logs for compliance audit purposes only</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Updates to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy periodically. We will notify you of significant changes via email or prominent notice on our platform. Your continued use after such notice constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Contact Information</h2>
            <p className="mb-4">For privacy-related questions or to exercise your rights, contact us at:</p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Data Protection Officer:</strong> <a
                href="mailto:dpo@trvlsocial.com"
                className="text-blue-600 hover:underline underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                dpo@trvlsocial.com
              </a></p>
              <p><strong>Privacy Team:</strong> <a
                href="mailto:privacy@trvlsocial.com"
                className="text-blue-600 hover:underline underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                privacy@trvlsocial.com
              </a></p>
              <p><strong>Phone:</strong> +1 (917) 242-1333</p>
              <p><strong>Website:</strong> trvlsocial.com</p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Supervisory Authority</h2>
            <p className="mb-4">
              If you are in the EU and believe we have not addressed your privacy concerns, you have the right to lodge a complaint with your local data protection authority.
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;