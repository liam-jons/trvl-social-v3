/**
 * BookingPaymentIntegration - Enhanced integration component with multi-currency and invoice support
 * Shows how split payment integrates with existing booking workflow plus new features
 */

import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import SplitPaymentContainer from './SplitPaymentContainer';
import MultiCurrencyPayment from './MultiCurrencyPayment';
import InvoiceManagement from './InvoiceManagement';
import {
  CreditCard,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Zap,
  Globe,
  Receipt,
  FileText
} from 'lucide-react';

const BookingPaymentIntegration = ({
  booking,
  onPaymentComplete,
  onPaymentError,
  disabled = false
}) => {
  const [paymentMethod, setPaymentMethod] = useState('full');
  const [processing, setProcessing] = useState(false);

  const handleFullPayment = async () => {
    setProcessing(true);
    try {
      // Process full payment directly through Stripe
      // This would integrate with your existing payment flow
      setTimeout(() => {
        onPaymentComplete?.({
          type: 'full_payment',
          amount: booking.totalAmount,
          paymentIntent: 'pi_demo_full_payment'
        });
        setProcessing(false);
      }, 2000);
    } catch (err) {
      onPaymentError?.(err);
      setProcessing(false);
    }
  };

  const handleSplitPaymentComplete = (splitData) => {
    onPaymentComplete?.({
      type: 'split_payment',
      splitPaymentId: splitData.splitPaymentId,
      ...splitData
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: booking.currency?.toUpperCase() || 'USD',
    }).format(amount / 100);
  };

  const getPaymentDeadline = () => {
    // Default to 3 days from now
    return new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Choose Payment Method</h3>

        <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="full" disabled={disabled}>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Pay Full</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="multi-currency" disabled={disabled}>
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Multi-Currency</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="split" disabled={disabled}>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Split Payment</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="invoices" disabled={disabled}>
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4" />
                <span>Invoices</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="full" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Summary */}
              <div>
                <h4 className="font-medium mb-3">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Total</span>
                    <span className="font-medium">{formatCurrency(booking.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span className="font-medium">Included</span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total Due</span>
                    <span className="font-bold">{formatCurrency(booking.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Benefits */}
              <div>
                <h4 className="font-medium mb-3">Full Payment Benefits</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Instant booking confirmation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Guaranteed reservation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">No payment deadlines</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Simple one-click payment</span>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleFullPayment}
              disabled={processing || disabled}
              className="w-full"
              size="lg"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {formatCurrency(booking.totalAmount)} Now
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="multi-currency" className="space-y-4 mt-6">
            <div className="mb-4">
              <h4 className="font-medium mb-2">Multi-Currency Payment Benefits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-primary" />
                  <span className="text-sm">Pay in your preferred currency</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Real-time exchange rates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Automatic invoice generation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">International tax compliance</span>
                </div>
              </div>
            </div>

            <MultiCurrencyPayment
              bookingId={booking.id}
              vendorId={booking.vendorId}
              vendorAccountId={booking.vendorAccountId}
              userId={booking.userId}
              baseAmount={booking.totalAmount}
              baseCurrency={booking.currency || 'USD'}
              description={booking.title}
              customerInfo={{
                name: booking.customerName,
                email: booking.customerEmail,
              }}
              vendorInfo={{
                name: booking.vendorName,
                email: booking.vendorEmail,
              }}
              onPaymentSuccess={onPaymentComplete}
              onPaymentError={onPaymentError}
            />
          </TabsContent>

          <TabsContent value="split" className="space-y-4 mt-6">
            <div className="mb-4">
              <h4 className="font-medium mb-2">Group Payment Benefits</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm">Split costs fairly among friends</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Each person pays only their share</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Automated payment reminders</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Secure payment links for all</span>
                </div>
              </div>
            </div>

            <SplitPaymentContainer
              bookingId={booking.id}
              totalAmount={booking.totalAmount}
              currency={booking.currency}
              vendorAccountId={booking.vendorAccountId}
              bookingDescription={booking.title}
              onPaymentComplete={handleSplitPaymentComplete}
              onError={onPaymentError}
              disabled={disabled}
            />
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4 mt-6">
            <div className="mb-4">
              <h4 className="font-medium mb-2">Invoice Management</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm">Professional invoice generation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Receipt className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Multiple template options</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Multi-currency support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Automatic tax calculations</span>
                </div>
              </div>
            </div>

            <InvoiceManagement
              userId={booking.userId}
              vendorId={booking.vendorId}
              bookingId={booking.id}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Payment Security Notice */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start space-x-3">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h5 className="text-sm font-medium mb-1">Secure Payment Processing</h5>
            <p className="text-xs text-muted-foreground">
              All payments are processed securely through Stripe. Your payment information is encrypted
              and never stored on our servers. Both individual and group payments are protected by
              bank-level security.
            </p>
          </div>
        </div>
      </Card>

      {/* Booking Details Reference */}
      <Card className="p-4 border-dashed">
        <h5 className="text-sm font-medium mb-2">Booking Details</h5>
        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <p className="font-medium">{booking.title}</p>
            <p>{booking.location}</p>
          </div>
          <div>
            <p>Duration: {booking.duration}</p>
            <p>Max Participants: {booking.maxParticipants}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BookingPaymentIntegration;