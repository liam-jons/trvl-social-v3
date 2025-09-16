#!/usr/bin/env node

/**
 * TRVL Social - Link Integrity Check Script
 *
 * Usage:
 *   npm run check-links           # Full check
 *   npm run check-links --quick   # Quick check (skip placeholder detection)
 *   npm run check-links --report  # Only show report summary
 */

import LinkChecker from '../src/utils/link-checker.js';

const args = process.argv.slice(2);
const isQuick = args.includes('--quick');
const reportOnly = args.includes('--report');

async function main() {
  if (reportOnly) {
    console.log('📄 Reading existing link integrity report...\n');

    try {
      const fs = await import('fs');
      const report = fs.readFileSync('./link-integrity-report.md', 'utf8');

      // Extract just the summary section
      const summaryMatch = report.match(/## Summary\n([\s\S]*?)\n## Route Health/);
      if (summaryMatch) {
        console.log('## Summary');
        console.log(summaryMatch[1]);
      }

      // Extract route health
      const healthMatch = report.match(/## Route Health: (.*)/);
      if (healthMatch) {
        console.log(`## Route Health: ${healthMatch[1]}`);
      }

      console.log('\n💡 Run without --report flag for a full check');

    } catch (error) {
      console.error('❌ No existing report found. Run full check first.');
      process.exit(1);
    }
    return;
  }

  console.log('🚀 TRVL Social - Link Integrity Check');

  if (isQuick) {
    console.log('⚡ Quick mode: Skipping placeholder page detection\n');
  } else {
    console.log('🔍 Full mode: Complete link and page analysis\n');
  }

  try {
    const checker = new LinkChecker();

    if (isQuick) {
      // Override placeholder check for quick mode
      checker.checkPlaceholderPages = async function() {
        console.log('📄 Skipping placeholder page check (quick mode)...');
        this.placeholderPages = [];
      };
    }

    await checker.runFullCheck();

    console.log('\n✅ Link integrity check completed successfully!');
    console.log('📄 Results saved to link-integrity-report.md');

    // Quick summary
    const broken = checker.brokenLinks.length;
    const working = checker.workingLinks.length;
    const total = broken + working;

    console.log('\n📊 Quick Summary:');
    console.log(`   🔗 Total links: ${total}`);
    console.log(`   ✅ Working: ${working}`);
    console.log(`   ❌ Broken: ${broken}`);

    if (broken > 0) {
      console.log(`\n⚠️  Found ${broken} broken links that need attention`);
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Link integrity check failed:', error);
    process.exit(1);
  }
}

main();