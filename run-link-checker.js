/**
 * Link Checker Runner
 * Simple Node.js script to run the link integrity checker
 */

import LinkChecker from './src/utils/link-checker.js';

async function runLinkCheck() {
  console.log('🚀 TRVL Social - Link Integrity Check\n');

  try {
    const checker = new LinkChecker();
    await checker.runFullCheck();

    console.log('\n✅ Link integrity check completed successfully!');
    console.log('📄 Check the generated link-integrity-report.md for detailed results.');

  } catch (error) {
    console.error('\n❌ Link integrity check failed:', error);
    process.exit(1);
  }
}

// Run the check
runLinkCheck();