/**
 * SplitPaymentContainer - Main component for managing group payment splitting
 * Orchestrates participant management, split calculations, and payment tracking
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import ParticipantManager from './ParticipantManager';
import SplitCalculator from './SplitCalculator';
import PaymentTracker from './PaymentTracker';
import PaymentLinkGenerator from './PaymentLinkGenerator';
import PaymentDeadlineManager from './PaymentDeadlineManager';
import { groupPaymentManager, paymentSplitting } from '../../services/split-payment-service';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const SplitPaymentContainer = ({
  bookingId,
  totalAmount,
  currency = 'usd',
  vendorAccountId,
  bookingDescription,
  onPaymentComplete,
  onError,
  initialParticipants = [],
  disabled = false
}) => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState('participants');
  const [splitPaymentId, setSplitPaymentId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Split payment state
  const [participants, setParticipants] = useState(initialParticipants);
  const [splitType, setSplitType] = useState('equal');
  const [customSplits, setCustomSplits] = useState([]);
  const [paymentDeadline, setPaymentDeadline] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
  );

  // Payment tracking state
  const [splitPaymentDetails, setSplitPaymentDetails] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [individualPayments, setIndividualPayments] = useState([]);

  // Calculate split preview
  const [splitPreview, setSplitPreview] = useState(null);

  useEffect(() => {
    if (participants.length > 0) {
      try {
        let preview;
        if (splitType === 'equal') {
          preview = paymentSplitting.calculateEqualSplit(
            totalAmount,
            participants.length,
            participants.some(p => p.id === user?.id)
          );
        } else if (splitType === 'custom' && customSplits.length === participants.length) {
          preview = paymentSplitting.calculateCustomSplit(totalAmount, customSplits);
        }
        setSplitPreview(preview);
      } catch (err) {
        setError(err.message);
      }
    }
  }, [participants, splitType, customSplits, totalAmount, user?.id]);

  // Load existing split payment if available
  useEffect(() => {
    const loadExistingSplitPayment = async () => {
      if (!bookingId || !user?.id) return;

      try {
        // Check if split payment already exists for this booking
        const { data, error } = await supabase
          .from('split_payments')
          .select('*')
          .eq('booking_id', bookingId)
          .single();

        if (data && !error) {
          setSplitPaymentId(data.id);
          await loadSplitPaymentDetails(data.id);
          setCurrentTab('tracking');
        }
      } catch (err) {
        // No existing split payment - this is fine
        console.log('No existing split payment found');
      }
    };

    loadExistingSplitPayment();
  }, [bookingId, user?.id]);

  const loadSplitPaymentDetails = async (id) => {
    try {
      const details = await groupPaymentManager.getSplitPaymentDetails(id);
      setSplitPaymentDetails(details.splitPayment);
      setPaymentStats(details.stats);
      setIndividualPayments(details.individualPayments);
    } catch (err) {
      setError(`Failed to load payment details: ${err.message}`);
    }
  };

  const handleCreateSplitPayment = async () => {
    if (!user?.id || !participants.length) {
      setError('Missing required information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const paymentData = {
        bookingId,
        organizerId: user.id,
        totalAmount,
        currency,
        participants: participants.map(p => ({
          userId: p.id || p.userId,
          id: p.id || p.userId,
          name: p.name,
          email: p.email,
        })),
        splitType,
        customSplits: splitType === 'custom' ? customSplits : null,
        paymentDeadline,
        vendorAccountId,
        description: bookingDescription,
        metadata: {
          createdBy: user.id,
          createdAt: new Date().toISOString(),
        },
      };

      const result = await groupPaymentManager.createSplitPayment(paymentData);

      setSplitPaymentId(result.splitPaymentId);
      setSplitPaymentDetails(result.splitPayment);
      setIndividualPayments(result.individualPayments);

      // Calculate initial stats
      const stats = groupPaymentManager.calculatePaymentStats(result.individualPayments);
      setPaymentStats(stats);

      setCurrentTab('links');

    } catch (err) {
      setError(`Failed to create split payment: ${err.message}`);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentUpdate = async () => {
    if (!splitPaymentId) return;

    try {
      await loadSplitPaymentDetails(splitPaymentId);
    } catch (err) {
      setError(`Failed to refresh payment details: ${err.message}`);
    }
  };

  const handlePaymentComplete = (paymentData) => {
    // Refresh payment details
    handlePaymentUpdate();
    onPaymentComplete?.(paymentData);
  };

  const canCreateSplit = participants.length > 0 && splitPreview && !splitPaymentId && !disabled;
  const hasActiveSplit = splitPaymentId && splitPaymentDetails;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Group Payment Splitting</h3>
          <p className="text-sm text-muted-foreground">
            Split the ${(totalAmount / 100).toFixed(2)} booking cost among group members
          </p>
        </div>
        {hasActiveSplit && (
          <Badge variant={
            paymentStats?.completionPercentage === 100 ? 'default' :
            paymentStats?.paidCount > 0 ? 'secondary' : 'outline'
          }>
            {paymentStats?.completionPercentage === 100 ? 'Complete' :
             paymentStats?.paidCount > 0 ? 'Partial' : 'Pending'}
          </Badge>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-destructive">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="participants" disabled={hasActiveSplit}>
            Participants
          </TabsTrigger>
          <TabsTrigger value="calculator" disabled={hasActiveSplit || participants.length === 0}>
            Split Calculator
          </TabsTrigger>
          <TabsTrigger value="links" disabled={!hasActiveSplit}>
            Payment Links
          </TabsTrigger>
          <TabsTrigger value="tracking" disabled={!hasActiveSplit}>
            Payment Tracking
          </TabsTrigger>
          <TabsTrigger value="deadlines" disabled={!hasActiveSplit}>
            Deadlines
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="space-y-4">
          <ParticipantManager
            participants={participants}
            onParticipantsChange={setParticipants}
            currentUserId={user?.id}
            disabled={hasActiveSplit || disabled}
            maxParticipants={20}
          />

          {participants.length > 0 && (
            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentTab('calculator')}
                disabled={hasActiveSplit}
              >
                Continue to Split Calculator
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <SplitCalculator
            totalAmount={totalAmount}
            currency={currency}
            participants={participants}
            splitType={splitType}
            onSplitTypeChange={setSplitType}
            customSplits={customSplits}
            onCustomSplitsChange={setCustomSplits}
            splitPreview={splitPreview}
            paymentDeadline={paymentDeadline}
            onPaymentDeadlineChange={setPaymentDeadline}
            disabled={hasActiveSplit || disabled}
          />

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentTab('participants')}
            >
              Back to Participants
            </Button>
            <Button
              onClick={handleCreateSplitPayment}
              disabled={!canCreateSplit || loading}
            >
              {loading ? 'Creating Split...' : 'Create Payment Split'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="links" className="space-y-4">
          {hasActiveSplit && (
            <PaymentLinkGenerator
              splitPaymentId={splitPaymentId}
              individualPayments={individualPayments}
              splitPaymentDetails={splitPaymentDetails}
              onPaymentUpdate={handlePaymentUpdate}
              disabled={disabled}
            />
          )}
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          {hasActiveSplit && (
            <PaymentTracker
              splitPaymentId={splitPaymentId}
              splitPaymentDetails={splitPaymentDetails}
              individualPayments={individualPayments}
              paymentStats={paymentStats}
              onPaymentUpdate={handlePaymentUpdate}
              onPaymentComplete={handlePaymentComplete}
              disabled={disabled}
            />
          )}
        </TabsContent>

        <TabsContent value="deadlines" className="space-y-4">
          {hasActiveSplit && (
            <PaymentDeadlineManager
              splitPaymentId={splitPaymentId}
              splitPaymentDetails={splitPaymentDetails}
              individualPayments={individualPayments}
              paymentStats={paymentStats}
              onDeadlineUpdate={handlePaymentUpdate}
              disabled={disabled}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SplitPaymentContainer;