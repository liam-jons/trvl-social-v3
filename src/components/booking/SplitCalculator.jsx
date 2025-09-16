/**
 * SplitCalculator - Component for calculating payment splits
 * Handles equal splits, custom amounts, and fee calculations
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { GlassInput } from '../ui/GlassInput';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { paymentSplitting, getSplitPaymentConfig } from '../../services/split-payment-service';
import { Calculator, DollarSign, Users, Clock, AlertCircle, Info } from 'lucide-react';

const SplitCalculator = ({
  totalAmount,
  currency = 'usd',
  participants = [],
  splitType,
  onSplitTypeChange,
  customSplits = [],
  onCustomSplitsChange,
  splitPreview,
  paymentDeadline,
  onPaymentDeadlineChange,
  disabled = false
}) => {
  const [feeHandling, setFeeHandling] = useState('organizer');
  const [showFeeBreakdown, setShowFeeBreakdown] = useState(false);
  const [customAmounts, setCustomAmounts] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});

  const config = getSplitPaymentConfig();

  // Initialize custom amounts when participants change
  useEffect(() => {
    if (splitType === 'custom' && participants.length > 0) {
      if (customAmounts.length !== participants.length) {
        const baseAmount = Math.floor(totalAmount / participants.length);
        const newAmounts = new Array(participants.length).fill(baseAmount);
        setCustomAmounts(newAmounts);
        onCustomSplitsChange(newAmounts);
      }
    }
  }, [participants.length, splitType, totalAmount]);

  // Validate custom amounts
  useEffect(() => {
    if (splitType === 'custom' && customAmounts.length > 0) {
      const errors = {};
      const total = customAmounts.reduce((sum, amount) => sum + (amount || 0), 0);

      if (total !== totalAmount) {
        errors.total = `Custom amounts total $${(total / 100).toFixed(2)} but should equal $${(totalAmount / 100).toFixed(2)}`;
      }

      customAmounts.forEach((amount, index) => {
        if (!amount || amount <= 0) {
          errors[`amount_${index}`] = 'Amount must be greater than 0';
        }
      });

      setValidationErrors(errors);
    } else {
      setValidationErrors({});
    }
  }, [customAmounts, totalAmount, splitType]);

  const handleCustomAmountChange = (index, value) => {
    const numValue = Math.round(parseFloat(value) * 100) || 0; // Convert to cents
    const newAmounts = [...customAmounts];
    newAmounts[index] = numValue;
    setCustomAmounts(newAmounts);
    onCustomSplitsChange(newAmounts);
  };

  const handleEqualizeAmounts = () => {
    const baseAmount = Math.floor(totalAmount / participants.length);
    const remainder = totalAmount % participants.length;

    const equalAmounts = new Array(participants.length).fill(baseAmount);
    // Distribute remainder among first few participants
    for (let i = 0; i < remainder; i++) {
      equalAmounts[i] += 1;
    }

    setCustomAmounts(equalAmounts);
    onCustomSplitsChange(equalAmounts);
  };

  const handleDeadlineChange = (e) => {
    const newDeadline = e.target.value;
    onPaymentDeadlineChange(newDeadline);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFeeCalculation = () => {
    if (!splitPreview) return null;

    const baseAmount = splitPreview.splits[0] || 0;
    return paymentSplitting.calculateSplitWithFees(
      baseAmount,
      participants.length,
      feeHandling
    );
  };

  const feeCalculation = getFeeCalculation();

  const isValidSplit = splitType === 'equal' ||
    (splitType === 'custom' && Object.keys(validationErrors).length === 0);

  return (
    <div className="space-y-6">
      {/* Split Type Selection */}
      <Card className="p-4">
        <h4 className="text-md font-medium mb-4 flex items-center">
          <Calculator className="w-4 h-4 mr-2" />
          Payment Split Configuration
        </h4>

        <Tabs value={splitType} onValueChange={onSplitTypeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="equal" disabled={disabled}>
              Equal Split
            </TabsTrigger>
            <TabsTrigger value="custom" disabled={disabled}>
              Custom Amounts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equal" className="space-y-4 mt-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Each of {participants.length} participants pays equally</span>
            </div>

            {splitPreview && (
              <div className="bg-muted/30 p-4 rounded-lg">
                <h5 className="text-sm font-medium mb-2">Split Preview</h5>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Per Person</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(splitPreview.baseAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Remainder Distribution</p>
                    <p className="text-sm">
                      {splitPreview.remainder > 0
                        ? `${splitPreview.remainder} participant(s) pay ${formatCurrency(splitPreview.baseAmount + 1)}`
                        : 'Even distribution'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                <span>Set custom amount for each participant</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEqualizeAmounts}
                disabled={disabled}
              >
                Equalize
              </Button>
            </div>

            <div className="space-y-3">
              {participants.map((participant, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{participant.name}</p>
                    <p className="text-xs text-muted-foreground">{participant.email}</p>
                  </div>
                  <div className="w-32">
                    <GlassInput
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={(customAmounts[index] || 0) / 100}
                      onChange={(e) => handleCustomAmountChange(index, e.target.value)}
                      disabled={disabled}
                      className={validationErrors[`amount_${index}`] ? 'border-destructive' : ''}
                    />
                    {validationErrors[`amount_${index}`] && (
                      <p className="text-xs text-destructive mt-1">
                        {validationErrors[`amount_${index}`]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Validation */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Amount</span>
                <span className={`text-sm font-semibold ${
                  validationErrors.total ? 'text-destructive' : 'text-primary'
                }`}>
                  {formatCurrency(customAmounts.reduce((sum, amount) => sum + (amount || 0), 0))}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Required Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              {validationErrors.total && (
                <p className="text-xs text-destructive mt-2 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {validationErrors.total}
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Payment Deadline */}
      <Card className="p-4">
        <h4 className="text-md font-medium mb-4 flex items-center">
          <Clock className="w-4 h-4 mr-2" />
          Payment Deadline
        </h4>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Deadline</label>
            <input
              type="datetime-local"
              value={paymentDeadline ? new Date(paymentDeadline).toISOString().slice(0, 16) : ''}
              onChange={handleDeadlineChange}
              disabled={disabled}
              min={new Date(Date.now() + config.minPaymentDeadlineHours * 60 * 60 * 1000).toISOString().slice(0, 16)}
              max={new Date(Date.now() + config.maxPaymentDeadlineHours * 60 * 60 * 1000).toISOString().slice(0, 16)}
              className="w-full p-2 border rounded-md bg-background"
            />
          </div>

          {paymentDeadline && (
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p className="font-medium">Deadline: {formatDate(paymentDeadline)}</p>
              <p className="text-xs mt-1">
                Participants have {Math.round((new Date(paymentDeadline) - new Date()) / (1000 * 60 * 60 * 24))} days to complete payment
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Fee Handling */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium flex items-center">
            <Info className="w-4 h-4 mr-2" />
            Payment Fees
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFeeBreakdown(!showFeeBreakdown)}
          >
            {showFeeBreakdown ? 'Hide' : 'Show'} Details
          </Button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Fee Handling</label>
            <select
              value={feeHandling}
              onChange={(e) => setFeeHandling(e.target.value)}
              disabled={disabled}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="organizer">Organizer pays all fees</option>
              <option value="split">Split fees among participants</option>
              <option value="participants">Each participant pays their own fees</option>
            </select>
          </div>

          {showFeeBreakdown && feeCalculation && (
            <div className="bg-muted/30 p-3 rounded-lg text-sm">
              <h5 className="font-medium mb-2">Fee Breakdown</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Base amount per person:</span>
                  <span>{formatCurrency(feeCalculation.originalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stripe fees per person:</span>
                  <span>{formatCurrency(feeCalculation.feesPerPerson)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total fees ({participants.length} people):</span>
                  <span>{formatCurrency(feeCalculation.totalFees)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Amount per participant:</span>
                  <span>{formatCurrency(feeCalculation.adjustedAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Summary */}
      {isValidSplit && splitPreview && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <h4 className="text-md font-medium mb-3">Split Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Participants</p>
              <p className="text-lg font-semibold">{participants.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Deadline</p>
              <p className="font-medium">{paymentDeadline ? formatDate(paymentDeadline) : 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fee Handling</p>
              <p className="font-medium capitalize">{feeHandling.replace('_', ' ')}</p>
            </div>
          </div>

          {splitType === 'equal' && (
            <div className="mt-4 p-3 bg-background rounded-lg">
              <p className="text-sm font-medium mb-2">Individual Amounts</p>
              <div className="flex flex-wrap gap-2">
                {splitPreview.splits.map((amount, index) => (
                  <Badge key={index} variant="outline">
                    {participants[index]?.name}: {formatCurrency(amount)}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default SplitCalculator;