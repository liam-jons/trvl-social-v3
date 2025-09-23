import { useState } from 'react';
import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';
import GlassButton from '../../components/ui/GlassButton';
const ContactPage = () => {
  const breadcrumbs = [{ title: "Contact Us" }];
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const contactMethods = [
    {
      type: 'General Support',
      icon: '💬',
      contact: 'support@trvlsocial.com',
      description: 'General questions and platform support',
      responseTime: '24-48 hours'
    },
    {
      type: 'Safety & Emergency',
      icon: '🚑',
      contact: '+1 (555) 911-SAFE',
      description: 'Urgent safety concerns and emergencies',
      responseTime: 'Immediate'
    },
    {
      type: 'Business Inquiries',
      icon: '🤝',
      contact: 'business@trvlsocial.com',
      description: 'Partnerships and business opportunities',
      responseTime: '3-5 business days'
    },
    {
      type: 'Press & Media',
      icon: '📰',
      contact: 'press@trvlsocial.com',
      description: 'Media inquiries and press releases',
      responseTime: '1-2 business days'
    }
  ];
  const categories = [
    'General Inquiry',
    'Technical Support',
    'Booking Issue',
    'Safety Concern',
    'Feature Request',
    'Bug Report',
    'Partnership',
    'Other'
  ];
  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
  };
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  return (
    <StaticPageLayout
      title="Contact Us"
      description="Get in touch with our team. We're here to help with any questions or concerns you may have."
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-12">
        {/* Contact Methods */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">How to Reach Us</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, index) => (
              <GlassCard key={index} className="text-center p-6">
                <div className="text-4xl mb-4">{method.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{method.type}</h3>
                <div className="text-blue-600 dark:text-blue-400 font-medium mb-2">
                  {method.contact}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  {method.description}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Response time: {method.responseTime}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
        {/* Contact Form */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Send Us a Message</h2>
          <div className="max-w-2xl mx-auto">
            <GlassCard className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <select
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category, index) => (
                        <option key={index} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Subject *</label>
                    <input
                      type="text"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of your inquiry"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message *</label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-black/20 border border-white/20 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Please provide detailed information about your inquiry..."
                  />
                </div>
                <div className="text-center">
                  <GlassButton type="submit" variant="primary" size="lg">
                    Send Message
                  </GlassButton>
                </div>
              </form>
            </GlassCard>
          </div>
        </section>
        {/* FAQ Quick Links */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
          <h2 className="text-3xl font-bold mb-8 text-center">Before You Contact Us</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-8">
            Check out these resources that might answer your question faster:
          </p>
          <div className="grid md:grid-cols-4 gap-4">
            <GlassButton variant="secondary" className="w-full">
              FAQ
            </GlassButton>
            <GlassButton variant="secondary" className="w-full">
              Help Center
            </GlassButton>
            <GlassButton variant="secondary" className="w-full">
              Safety Guidelines
            </GlassButton>
            <GlassButton variant="secondary" className="w-full">
              Community Guidelines
            </GlassButton>
          </div>
        </section>
        {/* Office Information */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Our Offices</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">🇺🇸</div>
              <h3 className="text-lg font-semibold mb-2">San Francisco, CA</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                123 Adventure Street<br />
                San Francisco, CA 94102<br />
                United States
              </p>
            </GlassCard>
            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">🇬🇧</div>
              <h3 className="text-lg font-semibold mb-2">London, UK</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                456 Travel Lane<br />
                London, E1 6AN<br />
                United Kingdom
              </p>
            </GlassCard>
            <GlassCard className="text-center p-6">
              <div className="text-4xl mb-4">🇸🇬</div>
              <h3 className="text-lg font-semibold mb-2">Singapore</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                789 Explorer Road<br />
                Singapore 018956<br />
                Singapore
              </p>
            </GlassCard>
          </div>
        </section>
        {/* Support Hours */}
        <GlassCard className="text-center p-8">
          <h2 className="text-2xl font-bold mb-6">Support Hours</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">24/7 Available</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">24-48 hour response</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Phone Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Mon-Fri 9AM-6PM PST</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Emergency Line</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">24/7 Available</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </StaticPageLayout>
  );
};
export default ContactPage;