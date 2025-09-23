#!/usr/bin/env node

/**
 * Email Service Test Script
 * Tests the email service configuration and functionality
 * Run with: node scripts/test-email.js [email]
 */

import { config } from 'dotenv';
import emailService from '../src/services/email-service.js';

// Load environment variables
config();

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorize(text, color) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function printHeader(title) {
  console.log('\n' + colorize('='.repeat(60), 'blue'));
  console.log(colorize(title.toUpperCase(), 'bold'));
  console.log(colorize('='.repeat(60), 'blue'));
}

async function testEmailService() {
  const testEmail = process.argv[2] || process.env.FROM_EMAIL || 'test@trvlsocial.com';

  printHeader('TRVL Social - Email Service Test');

  console.log(`Testing email delivery to: ${colorize(testEmail, 'bold')}`);

  try {
    // Test 1: Initialize email service
    console.log('\n📧 Initializing email service...');
    const initialized = await emailService.initialize();

    if (!initialized) {
      console.log(colorize('❌ Email service initialization failed', 'red'));
      console.log(colorize('Check your RESEND_API_KEY configuration', 'yellow'));
      return;
    }

    console.log(colorize('✅ Email service initialized successfully', 'green'));

    // Test 2: Test connection
    console.log('\n🔗 Testing email service connection...');
    const connectionTest = await emailService.testConnection();

    if (!connectionTest.success) {
      console.log(colorize(`❌ Connection test failed: ${connectionTest.message}`, 'red'));
      return;
    }

    console.log(colorize('✅ Connection test passed', 'green'));
    console.log(`Message ID: ${connectionTest.messageId}`);

    // Test 3: Send welcome email template
    console.log('\n📮 Testing welcome email template...');
    try {
      const welcomeResult = await emailService.sendTemplatedEmail('welcome', testEmail, {
        firstName: 'Test User'
      });

      console.log(colorize('✅ Welcome email sent successfully', 'green'));
      console.log(`Message ID: ${welcomeResult.messageId}`);
      console.log(`Template: ${welcomeResult.template}`);
    } catch (error) {
      console.log(colorize(`❌ Welcome email failed: ${error.message}`, 'red'));
    }

    // Test 4: Send custom email
    console.log('\n📄 Testing custom email...');
    try {
      const customResult = await emailService.sendEmail({
        to: testEmail,
        subject: 'TRVL Social - Email Service Test',
        html: `
          <h2>Email Service Test</h2>
          <p>This is a test email from the TRVL Social email service.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Timestamp: ${new Date().toISOString()}</li>
            <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
            <li>Service: Resend</li>
          </ul>
          <p>If you received this email, the email service is working correctly! 🎉</p>
        `,
        text: `
Email Service Test

This is a test email from the TRVL Social email service.

Test Details:
- Timestamp: ${new Date().toISOString()}
- Environment: ${process.env.NODE_ENV || 'development'}
- Service: Resend

If you received this email, the email service is working correctly!
        `,
        tags: [
          { name: 'test-type', value: 'email-service' },
          { name: 'script', value: 'test-email' }
        ]
      });

      console.log(colorize('✅ Custom email sent successfully', 'green'));
      console.log(`Message ID: ${customResult.messageId}`);
    } catch (error) {
      console.log(colorize(`❌ Custom email failed: ${error.message}`, 'red'));
    }

    // Test 5: Test rate limiting
    console.log('\n⏱️  Testing rate limiting...');
    const rateLimitTest = emailService.checkRateLimit(testEmail);
    console.log(`Rate limit check: ${rateLimitTest ? colorize('✅ OK', 'green') : colorize('❌ Exceeded', 'red')}`);

    // Test 6: Test email validation
    console.log('\n✅ Testing email validation...');
    const validEmails = [
      'test@example.com',
      'user+tag@domain.co.uk',
      'name.surname@company.org'
    ];

    const invalidEmails = [
      'invalid-email',
      'test@',
      '@domain.com',
      'test..test@domain.com'
    ];

    console.log('Valid emails:');
    validEmails.forEach(email => {
      const isValid = emailService.isValidEmail(email);
      console.log(`  ${email}: ${isValid ? colorize('✅', 'green') : colorize('❌', 'red')}`);
    });

    console.log('Invalid emails:');
    invalidEmails.forEach(email => {
      const isValid = emailService.isValidEmail(email);
      console.log(`  ${email}: ${isValid ? colorize('✅', 'green') : colorize('❌', 'red')}`);
    });

    console.log('\n' + colorize('🎉 Email service testing completed successfully!', 'bold'));
    console.log(colorize('Check your email inbox for test messages.', 'blue'));

  } catch (error) {
    console.error(colorize(`\n❌ Email service test failed: ${error.message}`, 'red'));
    console.error('Error details:', error);
    process.exit(1);
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEmailService().catch(error => {
    console.error(colorize(`\nFatal error: ${error.message}`, 'red'));
    process.exit(1);
  });
}