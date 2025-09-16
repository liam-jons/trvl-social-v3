import StaticPageLayout from '../../components/layout/StaticPageLayout';
import GlassCard from '../../components/ui/GlassCard';

const LicensesPage = () => {
  const breadcrumbs = [{ title: "Software Licenses" }];

  const openSourceLibraries = [
    {
      name: 'React',
      version: '18.2.0',
      license: 'MIT',
      description: 'A JavaScript library for building user interfaces',
      url: 'https://reactjs.org/'
    },
    {
      name: 'React Router',
      version: '6.8.0',
      license: 'MIT',
      description: 'Declarative routing for React',
      url: 'https://reactrouter.com/'
    },
    {
      name: 'Tailwind CSS',
      version: '3.2.4',
      license: 'MIT',
      description: 'A utility-first CSS framework',
      url: 'https://tailwindcss.com/'
    },
    {
      name: 'Framer Motion',
      version: '8.5.2',
      license: 'MIT',
      description: 'A production-ready motion library for React',
      url: 'https://www.framer.com/motion/'
    },
    {
      name: 'Heroicons',
      version: '2.0.13',
      license: 'MIT',
      description: 'Beautiful hand-crafted SVG icons',
      url: 'https://heroicons.com/'
    },
    {
      name: 'Headless UI',
      version: '1.7.7',
      license: 'MIT',
      description: 'Unstyled, fully accessible UI components',
      url: 'https://headlessui.com/'
    },
    {
      name: 'date-fns',
      version: '2.29.3',
      license: 'MIT',
      description: 'Modern JavaScript date utility library',
      url: 'https://date-fns.org/'
    },
    {
      name: 'Stripe',
      version: '11.1.0',
      license: 'MIT',
      description: 'JavaScript library for Stripe',
      url: 'https://stripe.com/'
    },
    {
      name: 'Socket.io Client',
      version: '4.6.1',
      license: 'MIT',
      description: 'Real-time bidirectional event-based communication',
      url: 'https://socket.io/'
    },
    {
      name: 'Chart.js',
      version: '4.2.1',
      license: 'MIT',
      description: 'Simple yet flexible JavaScript charting library',
      url: 'https://www.chartjs.org/'
    },
    {
      name: 'Leaflet',
      version: '1.9.3',
      license: 'BSD-2-Clause',
      description: 'Open-source JavaScript library for mobile-friendly interactive maps',
      url: 'https://leafletjs.com/'
    },
    {
      name: 'React Query',
      version: '4.24.6',
      license: 'MIT',
      description: 'Powerful data synchronization for React',
      url: 'https://tanstack.com/query/'
    }
  ];

  const licenseTexts = {
    'MIT': `Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`,
    'BSD-2-Clause': `Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.`
  };

  return (
    <StaticPageLayout
      title="Software Licenses & Attributions"
      description="TRVL Social is built with amazing open source software. Here are the licenses and attributions for the technologies we use."
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-12">
        {/* Introduction */}
        <section>
          <GlassCard className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <h2 className="text-2xl font-bold mb-4 text-center">Open Source Acknowledgments</h2>
            <p className="text-lg leading-relaxed text-center">
              TRVL Social is built on the shoulders of giants. We use many open source libraries and
              frameworks that make our platform possible. We're grateful to the open source community
              and the developers who contribute to these amazing projects.
            </p>
          </GlassCard>
        </section>

        {/* Open Source Libraries */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Third-Party Libraries</h2>
          <div className="space-y-4">
            {openSourceLibraries.map((library, index) => (
              <GlassCard key={index} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <h3 className="text-xl font-semibold mb-2">
                      <a 
                        href={library.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {library.name}
                      </a>
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">{library.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        Version: {library.version}
                      </span>
                      <span className={`px-2 py-1 rounded ${
                        library.license === 'MIT' 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      }`}>
                        {library.license} License
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* License Texts */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">License Texts</h2>
          
          {/* MIT License */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">MIT License</h3>
            <GlassCard className="p-6">
              <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {licenseTexts.MIT}
              </pre>
            </GlassCard>
          </div>

          {/* BSD-2-Clause License */}
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">BSD 2-Clause License</h3>
            <GlassCard className="p-6">
              <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
                {licenseTexts['BSD-2-Clause']}
              </pre>
            </GlassCard>
          </div>
        </section>

        {/* TRVL Social License */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">TRVL Social License</h2>
          <GlassCard className="p-8">
            <h3 className="text-xl font-semibold mb-4">Proprietary Software</h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              The TRVL Social platform, including our custom code, algorithms, designs, and branding,
              is proprietary software owned by TRVL Social, Inc. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-6 text-gray-600 dark:text-gray-300">
              <li>AI-powered personality matching algorithms</li>
              <li>Custom user interface components and designs</li>
              <li>Backend services and API implementations</li>
              <li>Database schemas and data models</li>
              <li>Business logic and workflow implementations</li>
              <li>Branding, logos, and visual identity</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              All rights reserved. No part of this software may be reproduced, distributed, or
              transmitted in any form or by any means without the prior written permission of
              TRVL Social, Inc.
            </p>
          </GlassCard>
        </section>

        {/* Attribution Requirements */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Attribution Requirements</h2>
          <GlassCard className="p-8">
            <p className="text-lg leading-relaxed mb-6">
              If you're using any of the open source libraries listed above in your own projects,
              please ensure you comply with their respective license requirements. Most MIT and
              BSD licensed software requires attribution in your documentation or about page.
            </p>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              For questions about licensing or to report any licensing issues, please contact our
              legal team at legal@trvlsocial.com.
            </p>
          </GlassCard>
        </section>

        {/* Contact */}
        <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Questions About Licensing?</h2>
          <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
            If you have questions about our use of open source software or licensing terms,
            we're happy to help.
          </p>
          <div className="text-center">
            <a 
              href="mailto:legal@trvlsocial.com"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Contact Legal Team
            </a>
          </div>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default LicensesPage;