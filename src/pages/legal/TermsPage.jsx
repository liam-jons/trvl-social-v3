import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';

const TermsPage = () => {
  const breadcrumbs = [{ title: "Terms of Service" }];

  return (
    <StaticPageLayout
      title="Terms of Service"
      description="These terms govern your use of TRVL Social and our services. Please read them carefully."
      breadcrumbs={breadcrumbs}
      showCTA={true}
      ctaTitle="Questions About Our Terms?"
      ctaDescription="Contact our legal team if you need clarification on any of these terms."
      ctaLink="mailto:legal@trvlsocial.com"
      ctaText="Contact Legal Team"
    >
      <div className="space-y-8">
        {/* Last Updated */}
        <GlassCard className="text-center p-4 bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <strong>Last Updated:</strong> March 15, 2024
          </p>
        </GlassCard>

        {/* Agreement */}
        <section>
          <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
          <p className="mb-4">
            By accessing or using TRVL Social (“we”, “us”, or “our”), you agree to be bound by these Terms of Service (“Terms”). If you disagree with any part of these terms, then you may not access the service.
          </p>
          <p>
            These Terms apply to all visitors, users, and others who access or use the service, including travelers, vendors, and content contributors.
          </p>
        </section>

        {/* Description of Service */}
        <section>
          <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
          <p className="mb-4">
            TRVL Social is a platform that connects travelers with compatible companions and verified vendors for shared travel experiences. Our services include:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>AI-powered personality matching for travel companions</li>
            <li>Adventure booking and payment processing</li>
            <li>Community features and communication tools</li>
            <li>Safety and verification services</li>
            <li>Vendor marketplace and management tools</li>
          </ul>
        </section>

        {/* User Accounts */}
        <section>
          <h2 className="text-2xl font-bold mb-4">3. User Accounts and Responsibilities</h2>
          <h3 className="text-lg font-semibold mb-3">3.1 Account Creation</h3>
          <p className="mb-4">
            To use certain features of our service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
          </p>
          
          <h3 className="text-lg font-semibold mb-3">3.2 Account Security</h3>
          <p className="mb-4">
            You are responsible for safeguarding your password and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.
          </p>
          
          <h3 className="text-lg font-semibold mb-3">3.3 Identity Verification</h3>
          <p className="mb-4">
            All users must complete our identity verification process, which may include providing government-issued identification, phone verification, and social media authentication.
          </p>
        </section>

        {/* Prohibited Uses */}
        <section>
          <h2 className="text-2xl font-bold mb-4">4. Prohibited Uses</h2>
          <p className="mb-4">You may not use our service:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
            <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
            <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
            <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
            <li>To submit false or misleading information</li>
            <li>To upload or transmit viruses or any other type of malicious code</li>
            <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
            <li>For any obscene or immoral purpose</li>
            <li>To interfere with or circumvent the security features of the service</li>
          </ul>
        </section>

        {/* Booking and Payments */}
        <section>
          <h2 className="text-2xl font-bold mb-4">5. Booking and Payments</h2>
          <h3 className="text-lg font-semibold mb-3">5.1 Booking Process</h3>
          <p className="mb-4">
            When you book an adventure through our platform, you enter into a contract with the vendor providing the service. TRVL Social acts as an intermediary to facilitate the booking and payment process.
          </p>
          
          <h3 className="text-lg font-semibold mb-3">5.2 Payment Terms</h3>
          <p className="mb-4">
            Payment is due at the time of booking unless otherwise specified. We charge a service fee for facilitating bookings. All prices are subject to change without notice.
          </p>
          
          <h3 className="text-lg font-semibold mb-3">5.3 Cancellations and Refunds</h3>
          <p className="mb-4">
            Cancellation and refund policies vary by vendor and trip type. Please review the specific cancellation policy for each booking. Refunds are processed according to the vendor's policy and our refund procedures.
          </p>
        </section>

        {/* Intellectual Property */}
        <section>
          <h2 className="text-2xl font-bold mb-4">6. Intellectual Property Rights</h2>
          <p className="mb-4">
            The service and its original content, features, and functionality are and will remain the exclusive property of TRVL Social and its licensors. The service is protected by copyright, trademark, and other laws.
          </p>
          <p className="mb-4">
            Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
          </p>
        </section>

        {/* User Content */}
        <section>
          <h2 className="text-2xl font-bold mb-4">7. User Content</h2>
          <p className="mb-4">
            Our service may allow you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material (“Content”). You are responsible for Content that you post to the service.
          </p>
          <p className="mb-4">
            By posting Content to the service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the service.
          </p>
        </section>

        {/* Privacy */}
        <section>
          <h2 className="text-2xl font-bold mb-4">8. Privacy Policy</h2>
          <p className="mb-4">
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
          </p>
        </section>

        {/* Disclaimers */}
        <section>
          <h2 className="text-2xl font-bold mb-4">9. Disclaimers</h2>
          <p className="mb-4">
            The information on this service is provided on an “as is” basis. To the fullest extent permitted by law, TRVL Social excludes all representations, warranties, conditions and terms related to our service and your use thereof.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section>
          <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
          <p className="mb-4">
            In no event shall TRVL Social, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
          </p>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-2xl font-bold mb-4">11. Governing Law</h2>
          <p className="mb-4">
            These Terms shall be interpreted and governed by the laws of the State of California, United States, without regard to its conflict of law provisions.
          </p>
        </section>

        {/* Changes to Terms */}
        <section>
          <h2 className="text-2xl font-bold mb-4">12. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
          </p>
        </section>

        {/* Contact Information */}
        <section>
          <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
          <p className="mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Email: legal@trvlsocial.com</li>
            <li>Phone: +1 (555) 123-4567</li>
            <li>Address: 123 Adventure Street, San Francisco, CA 94102</li>
          </ul>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default TermsPage;