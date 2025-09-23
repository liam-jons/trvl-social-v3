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
            <strong>Last Updated:</strong> September 20, 2025
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
          <h3 className="text-lg font-semibold mb-3">3.1 Age Requirements and COPPA Compliance</h3>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
            <p className="mb-3 font-semibold text-amber-800 dark:text-amber-200">
              IMPORTANT: You must be at least 13 years old to use TRVL Social.
            </p>
            <p className="mb-3">
              By creating an account, you represent and warrant that you are at least 13 years of age. We comply with the Children's Online Privacy Protection Act (COPPA) and do not knowingly collect personal information from children under 13.
            </p>
            <p className="mb-3">
              If we discover that we have collected personal information from a child under 13, we will immediately delete such information from our servers. If you are a parent or guardian and believe your child under 13 has provided us with personal information, please contact us immediately at privacy@trvlsocial.com.
            </p>
            <p>
              Providing false information about your age is a violation of these Terms and may result in immediate account termination. We reserve the right to request additional verification of your age at any time.
            </p>
          </div>

          <h3 className="text-lg font-semibold mb-3">3.2 Account Creation</h3>
          <p className="mb-4">
            To use certain features of our service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete. This includes providing your real date of birth for age verification purposes.
          </p>

          <h3 className="text-lg font-semibold mb-3">3.3 Account Security</h3>
          <p className="mb-4">
            You are responsible for safeguarding your password and for all activities that occur under your account. You agree to immediately notify us of any unauthorized use of your account.
          </p>

          <h3 className="text-lg font-semibold mb-3">3.4 Identity Verification</h3>
          <p className="mb-4">
            All users must complete our identity verification process, which may include providing government-issued identification, phone verification, and social media authentication. Age verification is part of this process and is required for COPPA compliance.
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

          <h3 className="text-lg font-semibold mb-3">5.2 Payment Processing</h3>
          <p className="mb-4">
            All payments are processed through Stripe, a third-party payment processor. By making a payment, you agree to Stripe's terms of service and privacy policy. We do not store your payment card information on our servers.
          </p>

          <h3 className="text-lg font-semibold mb-3">5.3 Payment Terms</h3>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Payment is due at the time of booking unless otherwise specified</li>
            <li>We charge a service fee for facilitating bookings</li>
            <li>Group bookings may support split payments among participants</li>
            <li>All prices are subject to change without notice</li>
            <li>Currency conversion fees may apply for international bookings</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">5.4 Cancellations and Refunds</h3>
          <p className="mb-4">
            Cancellation and refund policies vary by vendor and trip type. Refunds are processed according to the vendor's policy and our refund procedures:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Refunds are processed through the original payment method</li>
            <li>Processing time may vary by payment method and financial institution</li>
            <li>Service fees may be non-refundable depending on the cancellation timing</li>
            <li>Dispute resolution is available for payment-related issues</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">5.5 Billing Disputes</h3>
          <p className="mb-4">
            If you believe there is an error in your billing, please contact us within 60 days of the transaction. We will investigate and resolve billing disputes in good faith.
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

        {/* User Content and Social Features */}
        <section>
          <h2 className="text-2xl font-bold mb-4">7. User Content and Social Features</h2>

          <h3 className="text-lg font-semibold mb-3">7.1 User-Generated Content</h3>
          <p className="mb-4">
            Our service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). This includes but is not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Profile information and photos</li>
            <li>Travel posts, reviews, and experiences</li>
            <li>Comments, messages, and communications</li>
            <li>Media uploads including photos and videos</li>
            <li>Group discussions and forum posts</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">7.2 Content Standards and Prohibited Content</h3>
          <p className="mb-4">You agree not to post Content that:</p>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li>Is false, misleading, defamatory, or fraudulent</li>
            <li>Violates any third party's intellectual property rights</li>
            <li>Contains hate speech, harassment, or discriminatory language</li>
            <li>Includes personal information of others without consent</li>
            <li>Promotes illegal activities or violates any laws</li>
            <li>Contains malware, viruses, or other harmful code</li>
            <li>Is sexually explicit or inappropriate for a travel community</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">7.3 Content Licensing and Rights</h3>
          <p className="mb-4">
            By posting Content to the service, you grant us a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the service for the purpose of operating and providing the service.
          </p>
          <p className="mb-4">
            You retain ownership of your Content, but acknowledge that we may use it to promote our services, create compilations, and improve user experience.
          </p>

          <h3 className="text-lg font-semibold mb-3">7.4 Content Moderation</h3>
          <p className="mb-4">
            We reserve the right, but do not assume the obligation, to monitor, review, and remove Content that violates these Terms. We may remove Content and suspend or terminate accounts without prior notice.
          </p>

          <h3 className="text-lg font-semibold mb-3">7.5 Reporting Inappropriate Content</h3>
          <p className="mb-4">
            Users can report inappropriate content through our reporting system. We investigate all reports and take appropriate action in accordance with our community guidelines.
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

        {/* Dispute Resolution */}
        <section>
          <h2 className="text-2xl font-bold mb-4">11. Dispute Resolution</h2>

          <h3 className="text-lg font-semibold mb-3">11.1 Informal Resolution</h3>
          <p className="mb-4">
            Before filing any formal dispute, you agree to contact us at legal@trvlsocial.com to seek an informal resolution. We will work in good faith to resolve any concerns.
          </p>

          <h3 className="text-lg font-semibold mb-3">11.2 Arbitration</h3>
          <p className="mb-4">
            Any disputes that cannot be resolved informally will be resolved through binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules.
          </p>

          <h3 className="text-lg font-semibold mb-3">11.3 Class Action Waiver</h3>
          <p className="mb-4">
            You agree that any arbitration or legal proceeding will be conducted on an individual basis and not as part of a class action or representative proceeding.
          </p>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-2xl font-bold mb-4">12. Governing Law</h2>
          <p className="mb-4">
            These Terms shall be interpreted and governed by the laws of the State of California, United States, without regard to its conflict of law provisions. Any legal action must be brought in the federal or state courts located in San Francisco County, California.
          </p>
        </section>

        {/* Changes to Terms */}
        <section>
          <h2 className="text-2xl font-bold mb-4">13. Changes to Terms</h2>
          <p className="mb-4">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
          </p>
        </section>

        {/* Contact Information */}
        <section>
          <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
          <p className="mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Email: legal@trvlsocial.com</li>
            <li>Phone: +1 (917) 242-1333</li>
            <li>Website: trvlsocial.com</li>
          </ul>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default TermsPage;