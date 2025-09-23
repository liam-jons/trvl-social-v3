# TRVL Social - Manual Testing Checklist

## Overview
This document provides a comprehensive testing checklist for all critical user flows in TRVL Social. Each section should be tested thoroughly before deployment to production.

**Testing Environment:**
- [ ] Local development
- [ ] Staging environment
- [ ] Production (post-deployment verification)

**Date:** _______________
**Tester:** _______________
**Version:** _______________

---

## 1. Authentication Flow

### User Registration
- [ ] Navigate to registration page (/register)
- [ ] Verify form validation for all fields
  - [ ] Email format validation
  - [ ] Password strength requirements shown
  - [ ] Required fields marked clearly
- [ ] Submit registration with valid data
- [ ] Verify email verification sent
- [ ] Check for duplicate email prevention
- [ ] Verify user redirected to appropriate page
- [ ] Check profile creation flow initiates

### Email Verification
- [ ] Receive verification email within 5 minutes
- [ ] Click verification link
- [ ] Verify account activated successfully
- [ ] Check redirect to login or dashboard
- [ ] Test expired verification link behavior

### Login/Logout
- [ ] Navigate to login page (/login)
- [ ] Test invalid credentials error message
- [ ] Test successful login with valid credentials
- [ ] Verify session persistence across page refreshes
- [ ] Test "Remember Me" functionality
- [ ] Verify logout clears session completely
- [ ] Check redirect after logout

### Password Reset
- [ ] Navigate to password reset page
- [ ] Submit reset request with valid email
- [ ] Receive password reset email
- [ ] Click reset link and verify token validity
- [ ] Set new password successfully
- [ ] Verify can login with new password
- [ ] Test expired reset link behavior

### Profile Management
- [ ] Access profile page (/profile)
- [ ] Update profile information
  - [ ] Change display name
  - [ ] Update bio
  - [ ] Add/change profile photo
  - [ ] Update contact information
- [ ] Verify changes persist after refresh
- [ ] Test profile visibility settings

---

## 2. Adventure Booking Flow

### Browse Adventures
- [ ] Navigate to adventures page (/adventures)
- [ ] Verify adventures load correctly
- [ ] Check pagination works properly
- [ ] Test responsive design on mobile/tablet
- [ ] Verify images load with proper fallbacks

### Search and Filter
- [ ] Test search by keyword
  - [ ] Adventure name
  - [ ] Location
  - [ ] Description keywords
- [ ] Apply filters
  - [ ] Price range slider works
  - [ ] Category filters apply correctly
  - [ ] Date range selection
  - [ ] Difficulty level
  - [ ] Group size
- [ ] Verify filter combinations work
- [ ] Test filter reset functionality
- [ ] Check URL updates with filter parameters

### Adventure Details
- [ ] Click on adventure card
- [ ] Verify all details display
  - [ ] Title and description
  - [ ] Price information
  - [ ] Available dates
  - [ ] Location with map
  - [ ] Vendor information
  - [ ] Reviews and ratings
- [ ] Test image gallery/carousel
- [ ] Check social sharing buttons
- [ ] Verify wishlist add/remove

### Booking Process
- [ ] Select adventure dates
- [ ] Choose number of participants
- [ ] Verify price calculation updates
- [ ] Add optional extras if available
- [ ] Review booking summary
- [ ] Proceed to payment

### Payment Processing (Test Mode)
- [ ] Enter test payment details
  - [ ] Test card: 4242 4242 4242 4242
  - [ ] Any future expiry date
  - [ ] Any 3-digit CVC
- [ ] Verify payment processing animation
- [ ] Check for payment success confirmation
- [ ] Test payment failure scenarios
- [ ] Verify booking confirmation received

### Booking Confirmation
- [ ] View booking confirmation page
- [ ] Receive confirmation email
- [ ] Check booking appears in user dashboard
- [ ] Verify booking details accuracy
- [ ] Test download/print confirmation

### Booking Modifications
- [ ] Access existing booking
- [ ] Test date change request
- [ ] Test participant number change
- [ ] Verify modification fees displayed
- [ ] Submit modification request
- [ ] Check vendor notification sent

---

## 3. Payment & Split Payments

### Individual Payment
- [ ] Complete standard payment flow
- [ ] Verify payment methods available
  - [ ] Credit/Debit card
  - [ ] Saved payment methods
- [ ] Test payment validation
- [ ] Check payment receipt generation

### Group Payment Initiation
- [ ] Start group booking
- [ ] Select split payment option
- [ ] Add group members
  - [ ] By email
  - [ ] From connections
- [ ] Set split amounts/percentages
- [ ] Send payment invitations

### Split Payment Tracking
- [ ] View split payment dashboard
- [ ] Check payment status for each member
- [ ] Send payment reminders
- [ ] View partial payment progress
- [ ] Test deadline notifications

### Refund Requests
- [ ] Navigate to booking management
- [ ] Initiate refund request
- [ ] Select refund reason
- [ ] Upload supporting documents
- [ ] Submit refund request
- [ ] Track refund status
- [ ] Verify refund processing

### Payment Reconciliation
- [ ] View payment history
- [ ] Check transaction details
- [ ] Download payment statements
- [ ] Verify payment calculations
- [ ] Test dispute resolution flow

---

## 4. WhatsApp Integration

### Group Creation
- [ ] Enable WhatsApp integration
- [ ] Create adventure group
- [ ] Add members to WhatsApp group
- [ ] Verify group metadata syncs
- [ ] Test group naming conventions

### Message Sending
- [ ] Send message to group
- [ ] Verify message delivery
- [ ] Test message formatting
- [ ] Check media attachment support
- [ ] Test message threading

### Notification Preferences
- [ ] Access notification settings
- [ ] Toggle WhatsApp notifications
- [ ] Set quiet hours
- [ ] Choose notification types
- [ ] Verify settings persist

### Webhook Processing
- [ ] Test incoming webhook messages
- [ ] Verify webhook authentication
- [ ] Check message processing
- [ ] Test error handling
- [ ] Verify rate limiting

---

## 5. Vendor Dashboard

### Vendor Login
- [ ] Access vendor login (/vendor/login)
- [ ] Test vendor authentication
- [ ] Verify vendor role permissions
- [ ] Check dashboard redirect

### Create/Edit Adventures
- [ ] Access adventure creation form
- [ ] Fill all required fields
- [ ] Upload adventure images
- [ ] Set pricing and availability
- [ ] Save as draft
- [ ] Publish adventure
- [ ] Edit existing adventure
- [ ] Test adventure deletion

### View Bookings
- [ ] Access bookings dashboard
- [ ] View booking list
- [ ] Filter bookings by status
- [ ] View booking details
- [ ] Export booking data
- [ ] Process booking modifications

### Manage Payouts
- [ ] View payout dashboard
- [ ] Check pending payouts
- [ ] View payout history
- [ ] Update payout methods
- [ ] Request early payout
- [ ] Download payout reports

### View Analytics
- [ ] Access analytics dashboard
- [ ] View booking statistics
- [ ] Check revenue reports
- [ ] View customer demographics
- [ ] Track conversion rates
- [ ] Export analytics data

---

## 6. Admin Dashboard

### User Management
- [ ] Access admin panel (/admin)
- [ ] View user list
- [ ] Search/filter users
- [ ] View user details
- [ ] Suspend/activate users
- [ ] Reset user passwords
- [ ] Export user data

### Content Moderation
- [ ] Review reported content
- [ ] Moderate user reviews
- [ ] Approve/reject vendor listings
- [ ] Manage inappropriate content
- [ ] Apply content policies
- [ ] Track moderation history

### System Analytics
- [ ] View system health dashboard
- [ ] Check performance metrics
- [ ] Monitor error rates
- [ ] View usage statistics
- [ ] Track growth metrics
- [ ] Generate system reports

### Payment Reconciliation
- [ ] View all transactions
- [ ] Reconcile payments
- [ ] Handle payment disputes
- [ ] Process refunds
- [ ] Generate financial reports
- [ ] Export transaction data

---

## 7. Additional Features

### PWA Functionality
- [ ] Test offline mode capabilities
- [ ] Verify service worker caching
- [ ] Test app installation prompt
- [ ] Check push notifications
- [ ] Verify background sync
- [ ] Test app-like navigation

### Compatibility Demo
- [ ] Navigate to compatibility demo (/compatibility-demo)
- [ ] Complete personality quiz
- [ ] View compatibility results
- [ ] Test all 7 demo modes
- [ ] Verify animations work
- [ ] Check responsive design

### Search Functionality
- [ ] Global search works correctly
- [ ] Search suggestions appear
- [ ] Search history saved
- [ ] Advanced search filters
- [ ] Search results relevant
- [ ] Search performance acceptable

### Wishlist
- [ ] Add items to wishlist
- [ ] Remove items from wishlist
- [ ] Share wishlist
- [ ] View wishlist notifications
- [ ] Wishlist persistence

### Social Features
- [ ] Add/remove connections
- [ ] Create/join groups
- [ ] Group messaging works
- [ ] Activity feed updates
- [ ] Privacy settings respected

---

## 8. Performance & Security

### Performance Testing
- [ ] Page load time < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] Lighthouse score > 90
- [ ] Bundle sizes optimized
- [ ] Images load progressively
- [ ] No memory leaks detected

### Security Testing
- [ ] HTTPS enforced everywhere
- [ ] No console.log statements in production
- [ ] Authentication tokens secure
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] XSS protection verified
- [ ] CSRF tokens implemented
- [ ] SQL injection prevented

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Responsive Design
- [ ] Mobile (320px - 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1024px - 1920px)
- [ ] Large screens (> 1920px)

---

## 9. Error Handling

### 404 Pages
- [ ] Custom 404 page displays
- [ ] Navigation options available
- [ ] Search functionality present

### Error Messages
- [ ] User-friendly error messages
- [ ] Clear action steps provided
- [ ] Error logging works
- [ ] Support contact visible

### Network Errors
- [ ] Offline message appears
- [ ] Retry mechanisms work
- [ ] Graceful degradation
- [ ] Cache fallbacks active

---

## 10. Legal & Compliance

### Terms of Service
- [ ] Terms page accessible
- [ ] Content up to date
- [ ] Acceptance flow works
- [ ] Version tracking active

### Privacy Policy
- [ ] Privacy page accessible
- [ ] GDPR compliance verified
- [ ] Cookie consent works
- [ ] Data deletion requests

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] Alt text for images
- [ ] ARIA labels present

---

## Sign-off

### Testing Complete
- [ ] All critical paths tested
- [ ] No blocking issues found
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Ready for deployment

**Tester Signature:** _______________________
**Date:** _______________________

### Issues Found
Document any issues discovered during testing:

| Issue # | Description | Severity | Status |
|---------|------------|----------|--------|
| | | | |
| | | | |
| | | | |

### Notes
_Additional testing notes and observations:_

---

## Appendix: Test Data

### Test User Accounts
- Standard User: test@example.com / TestPass123!
- Vendor: vendor@example.com / VendorPass123!
- Admin: admin@example.com / AdminPass123!

### Test Payment Cards
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- Insufficient Funds: 4000 0000 0000 9995

### Test Booking IDs
- Single Booking: BOOK-TEST-001
- Group Booking: BOOK-TEST-GROUP-001
- Modified Booking: BOOK-TEST-MOD-001

---

*Last Updated: [Current Date]*
*Version: 1.0.0*