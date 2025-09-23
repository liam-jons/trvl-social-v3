import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

const CookiePolicy = () => {
  const lastUpdated = "September 20, 2025";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Cookie Policy</h1>
        <p className="mt-2 text-gray-600">Last updated: {lastUpdated}</p>
      </div>

      <Card className="p-8">
        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
            <p className="mb-4">
              Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our platform.
            </p>
            <p className="mb-4">
              We also use similar technologies like local storage, session storage, and web beacons to enhance functionality and gather analytics.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Types of Cookies We Use</h2>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <h3 className="text-xl font-medium">Essential Cookies</h3>
                  <Badge className="bg-blue-100 text-blue-800">Required</Badge>
                </div>
                <p className="mb-3">
                  These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility.
                </p>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Examples:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Authentication and session management</li>
                    <li>Security tokens and CSRF protection</li>
                    <li>Load balancing and routing</li>
                    <li>Accessibility settings</li>
                  </ul>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  <strong>Legal Basis:</strong> Necessary for contract performance
                  <br />
                  <strong>Retention:</strong> Session or until logout
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <h3 className="text-xl font-medium">Analytics & Performance Cookies</h3>
                  <Badge className="bg-green-100 text-green-800">Consent Required</Badge>
                </div>
                <p className="mb-3">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                </p>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Services Used:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>Mixpanel:</strong> User behavior analytics and funnel tracking</li>
                    <li><strong>Datadog:</strong> Performance monitoring and error tracking</li>
                    <li><strong>Sentry:</strong> Error monitoring and debugging</li>
                  </ul>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  <strong>Legal Basis:</strong> Consent or legitimate interest
                  <br />
                  <strong>Retention:</strong> Up to 24 months
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <h3 className="text-xl font-medium">Marketing Cookies</h3>
                  <Badge className="bg-orange-100 text-orange-800">Consent Required</Badge>
                </div>
                <p className="mb-3">
                  These cookies are used to deliver advertisements more relevant to you and your interests. They also limit the number of times you see an advertisement.
                </p>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Used For:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Personalized advertising</li>
                    <li>Social media integration</li>
                    <li>Marketing campaign tracking</li>
                    <li>Retargeting and remarketing</li>
                  </ul>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  <strong>Legal Basis:</strong> Consent
                  <br />
                  <strong>Retention:</strong> Up to 12 months
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center space-x-2 mb-3">
                  <h3 className="text-xl font-medium">Functional Cookies</h3>
                  <Badge className="bg-purple-100 text-purple-800">Consent Required</Badge>
                </div>
                <p className="mb-3">
                  These cookies enable enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages.
                </p>
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Features:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>User preferences and settings</li>
                    <li>Enhanced search functionality</li>
                    <li>Personalized recommendations</li>
                    <li>Social sharing features</li>
                  </ul>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  <strong>Legal Basis:</strong> Consent
                  <br />
                  <strong>Retention:</strong> Up to 12 months
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Third-Party Cookies</h2>
            <p className="mb-4">
              Some cookies are placed by third-party services that appear on our pages. We don't control these cookies and recommend reviewing the privacy policies of these services.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Privacy Policy</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mixpanel</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Analytics</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <a href="https://mixpanel.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        View Policy
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Datadog</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Performance Monitoring</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <a href="https://www.datadoghq.com/legal/privacy/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        View Policy
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sentry</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Error Tracking</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <a href="https://sentry.io/privacy/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        View Policy
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Stripe</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Payment Processing</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        View Policy
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Resend</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Email Services</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        View Policy
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Mapbox</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Maps & Location</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                        View Policy
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Managing Your Cookie Preferences</h2>

            <h3 className="text-xl font-medium mb-3">4.1 Our Cookie Preference Center</h3>
            <p className="mb-4">
              You can manage your cookie preferences at any time through our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">Privacy Preference Center</a>.
              This allows you to:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Accept or reject different categories of cookies</li>
              <li>View detailed information about each cookie type</li>
              <li>Update your preferences at any time</li>
              <li>Download your consent history</li>
            </ul>

            <h3 className="text-xl font-medium mb-3">4.2 Browser Settings</h3>
            <p className="mb-4">
              Most web browsers allow you to control cookies through their settings. You can usually:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Block all cookies</li>
              <li>Block third-party cookies</li>
              <li>Delete existing cookies</li>
              <li>Receive warnings before cookies are placed</li>
            </ul>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm">
                <strong>Note:</strong> Disabling essential cookies may affect the functionality of our website and prevent you from using certain features.
              </p>
            </div>

            <h3 className="text-xl font-medium mb-3 mt-6">4.3 Browser-Specific Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded p-4">
                <h4 className="font-medium mb-2">Chrome</h4>
                <p className="text-sm text-gray-600">Settings &gt; Privacy and Security &gt; Cookies and other site data</p>
              </div>
              <div className="border border-gray-200 rounded p-4">
                <h4 className="font-medium mb-2">Firefox</h4>
                <p className="text-sm text-gray-600">Preferences &gt; Privacy &amp; Security &gt; Cookies and Site Data</p>
              </div>
              <div className="border border-gray-200 rounded p-4">
                <h4 className="font-medium mb-2">Safari</h4>
                <p className="text-sm text-gray-600">Preferences &gt; Privacy &gt; Manage Website Data</p>
              </div>
              <div className="border border-gray-200 rounded p-4">
                <h4 className="font-medium mb-2">Edge</h4>
                <p className="text-sm text-gray-600">Settings &gt; Cookies and site permissions &gt; Cookies and site data</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Mobile App Data Collection</h2>
            <p className="mb-4">
              Our mobile applications may collect similar information using mobile identifiers and SDK technologies. You can manage these preferences through your device settings:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>iOS:</strong> Settings &gt; Privacy &amp; Security &gt; Tracking / Analytics &amp; Improvements</li>
              <li><strong>Android:</strong> Settings &gt; Privacy &gt; Ads / Usage &amp; diagnostics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Do Not Track</h2>
            <p className="mb-4">
              Some browsers include a "Do Not Track" feature. Currently, there is no industry standard for how to respond to Do Not Track signals. We continue to monitor developments in this area.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="mb-4">Cookie data is retained according to our data retention schedule:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
              <li><strong>Persistent Cookies:</strong> Stored until expiration or manual deletion</li>
              <li><strong>Analytics Data:</strong> Aggregated and anonymized after 24 months</li>
              <li><strong>Marketing Data:</strong> Deleted after 12 months of inactivity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. International Transfers</h2>
            <p className="mb-4">
              Cookie data may be transferred to and processed in countries outside your residence. We ensure adequate protection through appropriate safeguards such as Standard Contractual Clauses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Updates to This Policy</h2>
            <p className="mb-4">
              We may update this Cookie Policy to reflect changes in our practices or applicable laws. We will notify you of significant changes and obtain new consent where required.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Contact Us</h2>
            <p className="mb-4">
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Privacy Team:</strong> <a
                href="mailto:privacy@trvlsocial.com"
                className="text-blue-600 hover:underline underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                privacy@trvlsocial.com
              </a></p>
              <p><strong>Data Protection Officer:</strong> <a
                href="mailto:dpo@trvlsocial.com"
                className="text-blue-600 hover:underline underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              >
                dpo@trvlsocial.com
              </a></p>
              <p><strong>Phone:</strong> +1 (917) 242-1333</p>
              <p><strong>Website:</strong> trvlsocial.com</p>
            </div>
          </section>
        </div>
      </Card>
    </div>
  );
};

export default CookiePolicy;