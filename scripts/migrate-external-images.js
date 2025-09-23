#!/usr/bin/env node
/**
 * Migration script to replace external image URLs with local asset references
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to migrate and their categories
const MIGRATION_TARGETS = [
  {
    file: 'src/data/quiz-questions.ts',
    category: 'quiz',
    patterns: [
      { find: /imageUrl:\s*["']https:\/\/images\.unsplash\.com\/photo-[^"']+["']/g, replace: 'quiz' },
    ]
  },
  {
    file: 'src/data/mock-adventures.js',
    category: 'adventures',
    patterns: [
      { find: /["']https:\/\/images\.unsplash\.com\/photo-[^"']+["']/g, replace: 'adventures' }
    ]
  },
  {
    file: 'src/data/mock-vendors.js',
    category: 'vendors',
    patterns: [
      { find: /["']https:\/\/images\.unsplash\.com\/photo-[^"']+["']/g, replace: 'vendors' }
    ]
  },
  {
    file: 'src/pages/groups/recommendations/utils/mockGroupsData.js',
    category: 'demo',
    patterns: [
      { find: /["']https:\/\/picsum\.photos\/[^"']+["']/g, replace: 'demo' }
    ]
  }
];

// Test files to update
const TEST_FILES = [
  'src/services/__tests__/algorithm-regression.test.js',
  'src/services/group-optimization-test.js',
  'src/services/__tests__/group-optimization-integration.test.js',
  'src/components/admin/ModerationAppeals.jsx'
];

/**
 * Generate local image filename from external URL
 */
function generateLocalFilename(url, category, index = 0) {
  // Extract meaningful identifier from URL
  let identifier = 'default';

  if (url.includes('unsplash.com')) {
    const match = url.match(/photo-([a-zA-Z0-9-]+)/);
    identifier = match ? match[1].slice(0, 12) : 'unsplash';
  } else if (url.includes('picsum.photos')) {
    const match = url.match(/random=(\d+)/);
    identifier = match ? `picsum-${match[1]}` : 'picsum';
  } else if (url.includes('example.com')) {
    const match = url.match(/avatar(\d+)\.png/);
    identifier = match ? `avatar-${match[1]}` : 'example';
  }

  return `${category}-${identifier}-${index}.webp`;
}

/**
 * Create replacement string for image URL
 */
function createReplacement(originalMatch, category, filename) {
  if (originalMatch.includes('imageUrl:')) {
    return `imageUrl: imageAssetService.getImageUrl('${category}', '${filename}')`;
  } else {
    return `imageAssetService.getImageUrl('${category}', '${filename}')`;
  }
}

/**
 * Process a single file
 */
function processFile(filePath, category) {
  const fullPath = path.join(path.dirname(__dirname), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let hasChanges = false;
  let replacementCount = 0;

  // Add import if it's a TypeScript/JavaScript file and doesn't have it
  if ((filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.jsx'))
      && !content.includes('imageAssetService')) {
    const importLine = "import { imageAssetService } from '../services/image-asset-service';\n";

    // Find existing imports or add at top
    const importMatch = content.match(/import.*from.*['"];/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertIndex = lastImportIndex + lastImport.length;
      content = content.slice(0, insertIndex) + '\n' + importLine + content.slice(insertIndex);
    } else {
      content = importLine + '\n' + content;
    }
    hasChanges = true;
  }

  // Replace external image URLs
  const urlPattern = /(['"])(https:\/\/(?:images\.unsplash\.com|picsum\.photos|example\.com)[^'"]*\.(?:jpg|jpeg|png|gif|webp))(['"])/g;

  content = content.replace(urlPattern, (match, quote1, url, quote2) => {
    const filename = generateLocalFilename(url, category, replacementCount++);
    const replacement = `imageAssetService.getImageUrl('${category}', '${filename}')`;
    hasChanges = true;
    console.log(`  📸 ${url} → ${filename}`);
    return replacement;
  });

  // Handle imageUrl properties specifically
  const imageUrlPattern = /(imageUrl:\s*)(['"])(https:\/\/[^'"]*\.(?:jpg|jpeg|png|gif|webp))(['"])/g;

  content = content.replace(imageUrlPattern, (match, prefix, quote1, url, quote2) => {
    const filename = generateLocalFilename(url, category, replacementCount++);
    const replacement = `${prefix}imageAssetService.getImageUrl('${category}', '${filename}')`;
    hasChanges = true;
    console.log(`  🖼️  ${url} → ${filename}`);
    return replacement;
  });

  if (hasChanges) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated ${filePath} (${replacementCount} replacements)`);
  } else {
    console.log(`➖ No changes needed in ${filePath}`);
  }
}

/**
 * Process test files (replace with placeholder URLs)
 */
function processTestFile(filePath) {
  const fullPath = path.join(path.dirname(__dirname), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Test file not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let hasChanges = false;

  // Replace example.com URLs with placeholder pattern
  content = content.replace(/https:\/\/example\.com\/[^'"]*/g, (match) => {
    hasChanges = true;
    return '/images/placeholders/demo-placeholder.svg';
  });

  if (hasChanges) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Updated test file ${filePath}`);
  } else {
    console.log(`➖ No changes needed in test file ${filePath}`);
  }
}

/**
 * Main migration function
 */
function runMigration() {
  console.log('🚀 Starting external image migration...\n');

  // Process main files
  MIGRATION_TARGETS.forEach(target => {
    console.log(`📁 Processing ${target.file} (category: ${target.category})`);
    processFile(target.file, target.category);
    console.log('');
  });

  // Process test files
  console.log('🧪 Processing test files...');
  TEST_FILES.forEach(processTestFile);

  console.log('\n✨ Migration completed!');
  console.log('\nNext steps:');
  console.log('1. Review the changes in your files');
  console.log('2. Add actual image assets to public/images/ directories');
  console.log('3. Test the application to ensure images load correctly');
  console.log('4. Set up Supabase storage buckets for production');
}

// Run migration if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration, processFile, generateLocalFilename };