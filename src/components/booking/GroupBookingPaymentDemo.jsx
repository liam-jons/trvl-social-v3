/**
 * GroupBookingPaymentDemo - Demo component showcasing group payment splitting
 * This component demonstrates the complete payment splitting workflow
 */

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { GlassCard } from '../ui/GlassCard';
import SplitPaymentContainer from './SplitPaymentContainer';
import { MapPin, Users, Calendar, DollarSign, Clock } from 'lucide-react';

const GroupBookingPaymentDemo = () => {
  const [showPaymentSplit, setShowPaymentSplit] = useState(false);

  // Demo booking data
  const demoBooking = {
    id: 'demo-booking-123',
    title: 'Weekend Hiking Adventure in Yosemite',
    description: 'Join us for an amazing 3-day hiking adventure in Yosemite National Park. Includes guided tours, camping equipment, and meals.',
    location: 'Yosemite National Park, CA',
    duration: '3 days, 2 nights',
    totalAmount: 89900, // $899.00 in cents
    currency: 'usd',
    maxParticipants: 8,
    bookingDate: '2024-09-20',
    vendorAccountId: 'acct_demo_vendor_123',
    organizer: {
      id: 'user-123',
      name: 'Sarah Johnson',
      email: 'sarah@example.com'
    }
  };

  const handlePaymentComplete = (paymentData) => {
    console.log('Payment completed:', paymentData);
    // Handle payment completion - update booking status, send confirmations, etc.
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    // Handle payment errors - show user-friendly error messages
  };

  if (showPaymentSplit) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowPaymentSplit(false)}
            className="mb-4"
          >
            ← Back to Booking Details
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Booking Summary */}
            <div className="lg:col-span-1">
              <Card className="p-4 sticky top-6">
                <h3 className="font-semibold mb-3">Booking Summary</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{demoBooking.title}</p>
                      <p className="text-xs text-muted-foreground">{demoBooking.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{demoBooking.duration}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      ${(demoBooking.totalAmount / 100).toFixed(2)} total
                    </span>
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      {demoBooking.description}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Payment Split Interface */}
            <div className="lg:col-span-2">
              <SplitPaymentContainer
                bookingId={demoBooking.id}
                totalAmount={demoBooking.totalAmount}
                currency={demoBooking.currency}
                vendorAccountId={demoBooking.vendorAccountId}
                bookingDescription={demoBooking.title}
                onPaymentComplete={handlePaymentComplete}
                onError={handlePaymentError}
                initialParticipants={[]}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Demo Booking Card */}
      <GlassCard className="p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{demoBooking.title}</h2>
            <div className="flex items-center space-x-4 text-muted-foreground">
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{demoBooking.location}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{demoBooking.duration}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span className="text-sm">Up to {demoBooking.maxParticipants} people</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-primary">
              ${(demoBooking.totalAmount / 100).toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">per group</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-semibold mb-2">What's Included</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Professional hiking guide</li>
            <li>• Camping equipment and tents</li>
            <li>• All meals and snacks</li>
            <li>• Transportation to/from trailheads</li>
            <li>• First aid kit and safety equipment</li>
            <li>• Photography service</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <Button
            onClick={() => setShowPaymentSplit(true)}
            className="flex-1"
            size="lg"
          >
            <Users className="w-4 h-4 mr-2" />
            Split Payment with Group
          </Button>

          <Button
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Pay Full Amount
          </Button>
        </div>
      </GlassCard>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold">Easy Group Management</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Add participants by email, set custom amounts, and track who's paid
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold">Flexible Payment Options</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Equal splits, custom amounts, or percentage-based divisions
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold">Automated Reminders</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Automatic payment reminders and deadline enforcement
          </p>
        </Card>
      </div>

      {/* Demo Instructions */}
      <Card className="p-4 mt-6 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2 text-blue-700">Try the Demo</h3>
        <p className="text-sm text-blue-600 mb-3">
          Click "Split Payment with Group" to see how easy it is to organize group payments.
          You can add participants, configure payment splits, and generate payment links.
        </p>
        <div className="text-xs text-blue-500">
          <p><strong>Note:</strong> This is a demo environment. No actual payments will be processed.</p>
        </div>
      </Card>
    </div>
  );
};

export default GroupBookingPaymentDemo;