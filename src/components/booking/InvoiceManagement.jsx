import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import InvoiceService from '../../services/invoice-service';
import CurrencyService from '../../services/currency-service';
import { supabase } from '../../lib/supabase';
import { Download, Mail, Eye, FileText, DollarSign, Clock, Check, X } from 'lucide-react';
const InvoiceManagement = ({
  userId = null,
  vendorId = null,
  bookingId = null,
  className = '',
}) => {
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  useEffect(() => {
    loadInvoices();
    loadStats();
  }, [userId, vendorId, bookingId]);
  const loadInvoices = async () => {
    try {
      setLoading(true);
      let invoiceData;
      if (bookingId) {
        // Load invoices for specific booking
        const { data } = await supabase
          .from('invoices')
          .select('*')
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: false });
        invoiceData = data || [];
      } else if (userId) {
        invoiceData = await InvoiceService.getUserInvoices(userId);
      } else if (vendorId) {
        invoiceData = await InvoiceService.getVendorInvoices(vendorId);
      } else {
        invoiceData = [];
      }
      setInvoices(invoiceData);
    } catch (error) {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };
  const loadStats = async () => {
    try {
      const statsData = await InvoiceService.getInvoiceStats(userId, vendorId);
      setStats(statsData);
    } catch (error) {
    }
  };
  const handleDownloadPDF = async (invoiceId, template = 'standard') => {
    try {
      setActionLoading(prev => ({ ...prev, [`download-${invoiceId}`]: true }));
      const pdfBlob = await InvoiceService.generatePDF(invoiceId, template);
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download invoice. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`download-${invoiceId}`]: false }));
    }
  };
  const handleSendEmail = async (invoiceId, recipientEmail) => {
    try {
      setActionLoading(prev => ({ ...prev, [`email-${invoiceId}`]: true }));
      await InvoiceService.sendInvoiceEmail(invoiceId, recipientEmail);
      // Update invoice status
      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: 'sent' } : inv
      ));
      alert('Invoice sent successfully!');
    } catch (error) {
      alert('Failed to send invoice. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`email-${invoiceId}`]: false }));
    }
  };
  const handleCancelInvoice = async (invoiceId, reason = '') => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      setActionLoading(prev => ({ ...prev, [`cancel-${invoiceId}`]: true }));
      await InvoiceService.cancelInvoice(invoiceId, reason);
      // Update invoice status
      setInvoices(prev => prev.map(inv =>
        inv.id === invoiceId ? { ...inv, status: 'cancelled' } : inv
      ));
      alert('Invoice cancelled successfully.');
    } catch (error) {
      alert('Failed to cancel invoice. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [`cancel-${invoiceId}`]: false }));
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'sent':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Invoice Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <FileText className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Paid Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${stats.paidAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Check className="w-8 h-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Paid</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Invoice List */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Invoices</h3>
            <Button
              onClick={loadInvoices}
              disabled={loading}
              className="text-sm"
            >
              Refresh
            </Button>
          </div>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No invoices found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(invoice.status)}
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(invoice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {CurrencyService.formatAmount(invoice.total, invoice.currency)}
                        </p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedInvoice(invoice)}
                          disabled={actionLoading[`view-${invoice.id}`]}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPDF(invoice.id)}
                          disabled={actionLoading[`download-${invoice.id}`]}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {invoice.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const email = prompt('Enter recipient email:');
                              if (email) handleSendEmail(invoice.id, email);
                            }}
                            disabled={actionLoading[`email-${invoice.id}`]}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        )}
                        {['draft', 'sent'].includes(invoice.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelInvoice(invoice.id)}
                            disabled={actionLoading[`cancel-${invoice.id}`]}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Invoice Details */}
                  {invoice.customer_info && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Customer: {invoice.customer_info.name || invoice.customer_info.email}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDownload={(template) => handleDownloadPDF(selectedInvoice.id, template)}
          onSendEmail={(email) => handleSendEmail(selectedInvoice.id, email)}
        />
      )}
    </div>
  );
};
// Invoice Detail Modal Component
const InvoiceDetailModal = ({ invoice, isOpen, onClose, onDownload, onSendEmail }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Invoice Details</h3>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {/* Invoice Header */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Invoice Number</p>
                <p className="font-semibold">{invoice.invoice_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="font-semibold">
                  {CurrencyService.formatAmount(invoice.total, invoice.currency)}
                </p>
              </div>
            </div>
            {/* Customer Info */}
            {invoice.customer_info && (
              <div>
                <p className="text-sm font-medium text-gray-500">Customer</p>
                <div className="mt-1">
                  {invoice.customer_info.name && (
                    <p>{invoice.customer_info.name}</p>
                  )}
                  {invoice.customer_info.email && (
                    <p className="text-gray-600">{invoice.customer_info.email}</p>
                  )}
                  {invoice.customer_info.address && (
                    <p className="text-gray-600">{invoice.customer_info.address}</p>
                  )}
                </div>
              </div>
            )}
            {/* Line Items */}
            {invoice.line_items && invoice.line_items.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Line Items</p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Description
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.line_items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{item.description}</td>
                          <td className="px-4 py-2 text-right">
                            {CurrencyService.formatAmount(item.amount, invoice.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Actions */}
            <div className="border-t pt-4">
              <div className="flex items-center space-x-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Template</label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="mt-1 block w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="standard">Standard</option>
                    <option value="minimal">Minimal</option>
                    <option value="branded">Branded</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => onDownload(selectedTemplate)}
                    className="flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </Button>
                  {invoice.status === 'draft' && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        const email = prompt('Enter recipient email:');
                        if (email) onSendEmail(email);
                      }}
                      className="flex items-center space-x-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Email</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InvoiceManagement;