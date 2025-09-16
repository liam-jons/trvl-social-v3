/**
 * Link Integrity Checker for TRVL Social Application
 *
 * This script analyzes the codebase to find all navigation links, routes,
 * and verify their integrity. It checks for:
 * - Route definitions vs actual page components
 * - Link components and their targets
 * - Navigate function calls
 * - External links
 * - Broken or missing routes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

class LinkChecker {
  constructor() {
    this.routes = new Set();
    this.internalLinks = new Set();
    this.externalLinks = new Set();
    this.brokenLinks = [];
    this.placeholderPages = [];
    this.workingLinks = [];
    this.warnings = [];

    // Define known external domains
    this.externalDomains = [
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'linkedin.com',
      'youtube.com',
      'github.com'
    ];
  }

  /**
   * Main method to run the complete link check
   */
  async runFullCheck() {
    console.log('🔍 Starting comprehensive link integrity check...\n');

    try {
      // Step 1: Extract all routes from App.jsx
      await this.extractRoutesFromApp();

      // Step 2: Scan all components for links
      await this.scanAllComponents();

      // Step 3: Verify route integrity
      await this.verifyRouteIntegrity();

      // Step 4: Check for placeholder pages
      await this.checkPlaceholderPages();

      // Step 5: Generate comprehensive report
      this.generateReport();

    } catch (error) {
      console.error('❌ Error during link check:', error);
      throw error;
    }
  }

  /**
   * Extract all route definitions from App.jsx
   */
  async extractRoutesFromApp() {
    console.log('📱 Extracting routes from App.jsx...');

    const appPath = path.join(projectRoot, 'src/App.jsx');
    const appContent = fs.readFileSync(appPath, 'utf8');

    // Define the complete route structure based on App.jsx
    const definedRoutes = [
      // Root route
      '/',

      // Auth routes
      '/login',
      '/register',
      '/auth/forgot-password',
      '/auth/reset-password',

      // Public routes
      '/onboarding',
      '/search',

      // Wishlist routes
      '/wishlist',
      '/wishlist/shared/:shareId',

      // Adventure routes
      '/adventures',
      '/adventures/:id',

      // Community routes
      '/community',

      // Quiz routes
      '/quiz',
      '/quiz/results',
      '/quiz/history',

      // Group routes
      '/groups',
      '/groups/recommendations',
      '/groups/:id',

      // Vendor routes
      '/vendors',
      '/vendors/:id',

      // Protected routes
      '/dashboard',
      '/profile',
      '/settings',
      '/connections',
      '/offers',

      // Trip routes
      '/trips/request',

      // Demo pages
      '/booking-chat',
      '/compatibility-demo',

      // Admin routes
      '/admin',
      '/admin/ab-testing',
      '/admin/*',

      // Vendor portal routes
      '/vendor-portal',
      '/vendor-portal/*',
      '/vendor/payouts',
      '/vendor/bids',

      // Footer pages - Company
      '/about',
      '/careers',
      '/press',
      '/blog',

      // Footer pages - Support
      '/help',
      '/safety',
      '/contact',
      '/faq',

      // Footer pages - Legal
      '/terms',
      '/licenses',

      // Footer pages - Community
      '/guidelines',
      '/vendor-resources',
      '/api',
      '/partners',
      '/accessibility',

      // Error pages
      '/404'
    ];

    // Add all defined routes
    definedRoutes.forEach(route => {
      this.routes.add(route);
    });

    console.log(`✅ Found ${this.routes.size} route definitions`);
  }

  /**
   * Scan all components for Link, NavLink, navigate calls, etc.
   */
  async scanAllComponents() {
    console.log('🔍 Scanning components for navigation links...');

    const componentsDir = path.join(projectRoot, 'src');
    await this.scanDirectory(componentsDir);

    console.log(`✅ Found ${this.internalLinks.size} internal links and ${this.externalLinks.size} external links`);
  }

  /**
   * Recursively scan directory for React files
   */
  async scanDirectory(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await this.scanDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js'))) {
        await this.scanFile(fullPath);
      }
    }
  }

  /**
   * Scan individual file for navigation patterns
   */
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(projectRoot, filePath);

      // Skip scanning the link-checker script itself to avoid false positives
      if (relativePath.includes('link-checker.js')) {
        return;
      }

      // Find Link and NavLink components
      this.extractLinksFromContent(content, relativePath);

      // Find navigate() calls
      this.extractNavigateCalls(content, relativePath);

      // Find button onClick handlers with navigation
      this.extractButtonNavigation(content, relativePath);

      // Find anchor tags
      this.extractAnchorTags(content, relativePath);

    } catch (error) {
      this.warnings.push(`Warning: Could not read file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Extract Link and NavLink components
   */
  extractLinksFromContent(content, filePath) {
    // Match <Link to="path"> and <NavLink to="path">
    const linkMatches = content.matchAll(/<(?:Link|NavLink)[^>]*to="([^"]+)"/g);

    for (const match of linkMatches) {
      const linkTo = match[1];
      this.categorizeLink(linkTo, filePath, 'Link/NavLink');
    }
  }

  /**
   * Extract navigate() function calls
   */
  extractNavigateCalls(content, filePath) {
    // Match navigate('path') or navigate("path")
    const navigateMatches = content.matchAll(/navigate\s*\(\s*['"`]([^'"`]+)['"`]/g);

    for (const match of navigateMatches) {
      const navigateTo = match[1];
      this.categorizeLink(navigateTo, filePath, 'navigate()');
    }
  }

  /**
   * Extract button onClick navigation
   */
  extractButtonNavigation(content, filePath) {
    // This is more complex - look for common patterns
    // onClick={() => navigate('/path')}
    const buttonNavMatches = content.matchAll(/onClick=\{[^}]*navigate\s*\(\s*['"`]([^'"`]+)['"`]/g);

    for (const match of buttonNavMatches) {
      const navigateTo = match[1];
      this.categorizeLink(navigateTo, filePath, 'Button onClick');
    }
  }

  /**
   * Extract anchor tags
   */
  extractAnchorTags(content, filePath) {
    // Match <a href="url">
    const anchorMatches = content.matchAll(/<a[^>]*href="([^"]+)"/g);

    for (const match of anchorMatches) {
      const href = match[1];
      this.categorizeLink(href, filePath, 'Anchor tag');
    }
  }

  /**
   * Categorize link as internal or external
   */
  categorizeLink(linkPath, filePath, linkType) {
    // Skip JavaScript expressions and dynamic paths
    if (linkPath.includes('${') || linkPath.includes('{') || linkPath.startsWith('#')) {
      return;
    }

    // Check if it's an external URL
    if (linkPath.startsWith('http://') || linkPath.startsWith('https://') || linkPath.startsWith('//')) {
      this.externalLinks.add({
        url: linkPath,
        file: filePath,
        type: linkType
      });
    } else {
      // Internal link - normalize the path
      let normalizedPath = linkPath.startsWith('/') ? linkPath : `/${linkPath}`;

      this.internalLinks.add({
        path: normalizedPath,
        file: filePath,
        type: linkType
      });
    }
  }

  /**
   * Verify that all internal links have corresponding routes
   */
  async verifyRouteIntegrity() {
    console.log('🔗 Verifying route integrity...');

    const routeArray = Array.from(this.routes);
    const linkArray = Array.from(this.internalLinks);

    // Check each internal link against defined routes
    for (const link of linkArray) {
      const linkPath = link.path;
      let routeExists = false;

      // Check exact match first
      if (routeArray.includes(linkPath)) {
        routeExists = true;
      } else {
        // Check for parameterized routes (e.g., /adventures/:id)
        for (const route of routeArray) {
          if (this.matchesParameterizedRoute(linkPath, route)) {
            routeExists = true;
            break;
          }
        }
      }

      if (routeExists) {
        this.workingLinks.push(link);
      } else {
        this.brokenLinks.push({
          ...link,
          reason: 'No matching route found'
        });
      }
    }

    console.log(`✅ Checked ${linkArray.length} internal links`);
  }

  /**
   * Check if a path matches a parameterized route
   */
  matchesParameterizedRoute(path, routePattern) {
    // Convert route pattern to regex
    // e.g., /adventures/:id becomes /adventures/[^/]+
    const regexPattern = routePattern
      .replace(/:[\w]+/g, '[^/]+')  // Replace :param with [^/]+
      .replace(/\*/g, '.*');        // Replace * with .*

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Check for placeholder pages that might not be fully implemented
   */
  async checkPlaceholderPages() {
    console.log('📄 Checking for placeholder pages...');

    const pagesDir = path.join(projectRoot, 'src/pages');
    await this.scanPagesForPlaceholders(pagesDir);

    console.log(`✅ Found ${this.placeholderPages.length} potential placeholder pages`);
  }

  /**
   * Recursively scan pages directory for placeholder content
   */
  async scanPagesForPlaceholders(dirPath) {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await this.scanPagesForPlaceholders(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js'))) {
        await this.checkPageForPlaceholder(fullPath);
      }
    }
  }

  /**
   * Check if a page appears to be a placeholder
   */
  async checkPageForPlaceholder(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(path.join(projectRoot, 'src'), filePath);

      // Common placeholder indicators
      const placeholderPatterns = [
        /coming\s+soon/i,
        /under\s+construction/i,
        /placeholder/i,
        /todo\s*:/i,
        /not\s+implemented/i,
        /work\s+in\s+progress/i,
        /<div[^>]*>\s*<h[12][^>]*>[^<]*<\/h[12]>\s*<\/div>/i  // Simple heading-only pages
      ];

      // Check for very short components (likely placeholders)
      const componentLines = content.split('\n').filter(line => line.trim().length > 0);
      const isVeryShort = componentLines.length < 15;

      const hasPlaceholderText = placeholderPatterns.some(pattern => pattern.test(content));

      if (hasPlaceholderText || isVeryShort) {
        // Find corresponding route
        const pageName = path.basename(filePath, path.extname(filePath));
        const route = this.findRouteForPage(pageName);

        this.placeholderPages.push({
          file: relativePath,
          route: route,
          reason: hasPlaceholderText ? 'Contains placeholder text' : 'Very short component (likely placeholder)',
          lineCount: componentLines.length
        });
      }

    } catch (error) {
      this.warnings.push(`Warning: Could not check placeholder status for ${filePath}: ${error.message}`);
    }
  }

  /**
   * Try to find the route that corresponds to a page component
   */
  findRouteForPage(pageName) {
    // Simple mapping from page names to routes
    const pageToRouteMap = {
      'HomePage': '/',
      'AdventuresPage': '/adventures',
      'AdventureDetailPage': '/adventures/:id',
      'GroupsPage': '/groups',
      'GroupDetailPage': '/groups/:id',
      'VendorsPage': '/vendors',
      'VendorDetailPage': '/vendors/:id',
      'AboutPage': '/about',
      'CareersPage': '/careers',
      'ContactPage': '/contact',
      'HelpPage': '/help',
      'TermsPage': '/terms',
      'FAQPage': '/faq',
      'SafetyPage': '/safety',
      'PressPage': '/press',
      'BlogPage': '/blog',
      'LicensesPage': '/licenses',
      'GuidelinesPage': '/guidelines',
      'VendorResourcesPage': '/vendor-resources',
      'APIPage': '/api',
      'PartnersPage': '/partners',
      'AccessibilityPage': '/accessibility'
    };

    return pageToRouteMap[pageName] || 'Unknown route';
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('\n📊 Generating Link Integrity Report...\n');

    const report = this.buildMarkdownReport();

    // Write report to file
    const reportPath = path.join(projectRoot, 'link-integrity-report.md');
    fs.writeFileSync(reportPath, report);

    // Also log to console
    console.log(report);
    console.log(`\n💾 Report saved to: ${reportPath}`);
  }

  /**
   * Build markdown report
   */
  buildMarkdownReport() {
    const totalRoutes = this.routes.size;
    const totalInternalLinks = this.internalLinks.size;
    const totalExternalLinks = this.externalLinks.size;
    const totalWorking = this.workingLinks.length;
    const totalBroken = this.brokenLinks.length;
    const totalPlaceholder = this.placeholderPages.length;

    let report = `# Link Integrity Report
Generated: ${new Date().toISOString()}

## Summary
- **Total Routes Defined**: ${totalRoutes}
- **Internal Links Found**: ${totalInternalLinks}
- **External Links Found**: ${totalExternalLinks}
- **Working Links**: ${totalWorking}
- **Broken Links**: ${totalBroken}
- **Placeholder Pages**: ${totalPlaceholder}
- **Warnings**: ${this.warnings.length}

## Route Health: ${totalBroken === 0 ? '✅ HEALTHY' : '❌ ISSUES FOUND'}

---

`;

    // Defined Routes Section
    report += `## 📱 Defined Routes (${totalRoutes})
`;
    const sortedRoutes = Array.from(this.routes).sort();
    sortedRoutes.forEach(route => {
      report += `- \`${route}\`\n`;
    });
    report += '\n';

    // Broken Links Section
    if (totalBroken > 0) {
      report += `## ❌ Broken Links (${totalBroken})
`;
      this.brokenLinks.forEach((link, index) => {
        report += `${index + 1}. **${link.path}** (${link.type})
   - File: \`${link.file}\`
   - Issue: ${link.reason}

`;
      });
    }

    // Placeholder Pages Section
    if (totalPlaceholder > 0) {
      report += `## ⚠️ Placeholder Pages (${totalPlaceholder})
`;
      this.placeholderPages.forEach((page, index) => {
        report += `${index + 1}. **${page.route}**
   - File: \`${page.file}\`
   - Reason: ${page.reason}
   - Lines: ${page.lineCount}

`;
      });
    }

    // Working Links Section
    if (totalWorking > 0) {
      report += `## ✅ Working Internal Links (${totalWorking})
`;
      const groupedByType = {};
      this.workingLinks.forEach(link => {
        if (!groupedByType[link.type]) {
          groupedByType[link.type] = [];
        }
        groupedByType[link.type].push(link);
      });

      Object.entries(groupedByType).forEach(([type, links]) => {
        report += `\n### ${type} (${links.length})\n`;
        links.forEach(link => {
          report += `- \`${link.path}\` in \`${link.file}\`\n`;
        });
      });
      report += '\n';
    }

    // External Links Section
    if (totalExternalLinks > 0) {
      report += `## 🔗 External Links (${totalExternalLinks})
`;
      const externalArray = Array.from(this.externalLinks);
      externalArray.forEach((link, index) => {
        report += `${index + 1}. **${link.url}** (${link.type})
   - File: \`${link.file}\`

`;
      });
    }

    // Warnings Section
    if (this.warnings.length > 0) {
      report += `## ⚠️ Warnings (${this.warnings.length})
`;
      this.warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning}\n`;
      });
      report += '\n';
    }

    // Missing Routes Section (Routes defined but no pages found)
    const missingPages = this.findMissingPages();
    if (missingPages.length > 0) {
      report += `## 🚫 Routes Missing Corresponding Pages (${missingPages.length})
`;
      missingPages.forEach((route, index) => {
        report += `${index + 1}. \`${route}\`\n`;
      });
      report += '\n';
    }

    // Footer Page Check
    report += `## 📄 Footer Page Status
This report specifically checked the footer links from \`Footer.jsx\`:

### Company Pages
- /about `;
    report += this.routes.has('/about') ? '✅' : '❌';
    report += `
- /careers `;
    report += this.routes.has('/careers') ? '✅' : '❌';
    report += `
- /press `;
    report += this.routes.has('/press') ? '✅' : '❌';
    report += `
- /blog `;
    report += this.routes.has('/blog') ? '✅' : '❌';
    report += `

### Support Pages
- /help `;
    report += this.routes.has('/help') ? '✅' : '❌';
    report += `
- /safety `;
    report += this.routes.has('/safety') ? '✅' : '❌';
    report += `
- /contact `;
    report += this.routes.has('/contact') ? '✅' : '❌';
    report += `
- /faq `;
    report += this.routes.has('/faq') ? '✅' : '❌';
    report += `

### Legal Pages
- /terms `;
    report += this.routes.has('/terms') ? '✅' : '❌';
    report += `
- /privacy `;
    report += this.routes.has('/privacy') ? '✅' : '❌ (Footer links to /privacy but route not defined)';
    report += `
- /cookies `;
    report += this.routes.has('/cookies') ? '✅' : '❌ (Footer links to /cookies but route not defined)';
    report += `
- /licenses `;
    report += this.routes.has('/licenses') ? '✅' : '❌';
    report += `

### Community Pages
- /guidelines `;
    report += this.routes.has('/guidelines') ? '✅' : '❌';
    report += `
- /vendor-resources `;
    report += this.routes.has('/vendor-resources') ? '✅' : '❌';
    report += `
- /api `;
    report += this.routes.has('/api') ? '✅' : '❌';
    report += `
- /partners `;
    report += this.routes.has('/partners') ? '✅' : '❌';
    report += `
- /accessibility `;
    report += this.routes.has('/accessibility') ? '✅' : '❌';
    report += `

`;

    report += `---

## Recommendations

### High Priority Fixes
`;

    if (totalBroken > 0) {
      report += `1. **Fix Broken Links**: ${totalBroken} links point to undefined routes\n`;
    }

    // Check for missing legal pages
    if (!this.routes.has('/privacy')) {
      report += `2. **Add Privacy Policy Route**: Footer links to /privacy but no route exists\n`;
    }
    if (!this.routes.has('/cookies')) {
      report += `3. **Add Cookie Policy Route**: Footer links to /cookies but no route exists\n`;
    }

    report += `
### Medium Priority
`;
    if (totalPlaceholder > 0) {
      report += `1. **Complete Placeholder Pages**: ${totalPlaceholder} pages appear to be placeholders\n`;
    }

    report += `2. **Verify External Links**: Test that all ${totalExternalLinks} external links are still valid
3. **Add Loading States**: Ensure all routes have proper loading states
4. **404 Handling**: Verify 404 page works correctly for undefined routes

### Low Priority
1. **Code Cleanup**: Review any warnings in the report
2. **Link Optimization**: Consider preloading critical routes
3. **Accessibility**: Ensure all navigation is keyboard accessible

---

*Generated by TRVL Social Link Integrity Checker*
`;

    return report;
  }

  /**
   * Find routes that don't have corresponding pages
   */
  findMissingPages() {
    // This would need to scan the pages directory and compare with routes
    // For now, return empty array - this could be expanded
    return [];
  }
}

// Export for use in other modules or direct execution
export default LinkChecker;

// If running directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new LinkChecker();
  checker.runFullCheck().catch(console.error);
}