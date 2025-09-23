/**
 * Invoice Generation Service
 * Handles invoice creation, PDF generation, and delivery
 */

import { supabase } from '../lib/supabase.js';
import CurrencyService from './currency-service.js';
import emailService from './email-service.js';

// Configuration
const INVOICE_CONFIG = {
  numberPrefix: 'TRVL',
  numberLength: 8,
  pdfGenerator: 'jspdf', // or 'html2pdf'
  templates: {
    standard: 'standard-invoice-template',
    minimal: 'minimal-invoice-template',
    branded: 'branded-invoice-template',
  },
  deliveryMethods: ['email', 'download', 'webhook'],
  retentionDays: 2555, // 7 years
};

// Company/Platform Information
const COMPANY_INFO = {
  name: import.meta.env.VITE_COMPANY_NAME || 'TRVL Social',
  address: {
    line1: import.meta.env.VITE_COMPANY_ADDRESS_1 || '123 Travel Street',
    line2: import.meta.env.VITE_COMPANY_ADDRESS_2 || '',
    city: import.meta.env.VITE_COMPANY_CITY || 'San Francisco',
    state: import.meta.env.VITE_COMPANY_STATE || 'CA',
    postal: import.meta.env.VITE_COMPANY_POSTAL || '94102',
    country: import.meta.env.VITE_COMPANY_COUNTRY || 'United States',
  },
  contact: {
    email: import.meta.env.VITE_COMPANY_EMAIL || 'support@trvlsocial.com',
    phone: import.meta.env.VITE_COMPANY_PHONE || '+1-555-TRVL-HELP',
    website: import.meta.env.VITE_APP_URL || 'https://trvlsocial.com',
  },
  tax: {
    number: import.meta.env.VITE_TAX_NUMBER || 'TAX123456789',
    vat: import.meta.env.VITE_VAT_NUMBER || 'VAT987654321',
  },
  logo: '/assets/logo.png', // Path to company logo
};

/**
 * Invoice Service
 */
export class InvoiceService {
  /**
   * Generate invoice number
   */
  static generateInvoiceNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const number = `${INVOICE_CONFIG.numberPrefix}-${timestamp.slice(-6)}-${random}`;
    return number;
  }

  /**
   * Create invoice record
   */
  static async createInvoice(invoiceData) {
    const {
      bookingId,
      userId,
      vendorId,
      vendorAccountId,
      amount,
      currency,
      taxRate,
      items = [],
      customerInfo,
      vendorInfo,
      template = 'standard',
      dueDate = null,
      notes = '',
    } = invoiceData;

    // Validate required fields
    if (!bookingId || !userId || !amount || !currency) {
      throw new Error('Booking ID, user ID, amount, and currency are required');
    }

    try {
      // Calculate tax and totals
      const subtotal = amount;
      const taxAmount = CurrencyService.calculateTax(subtotal, currency, taxRate);
      const total = subtotal + taxAmount;

      // Generate invoice number
      const invoiceNumber = this.generateInvoiceNumber();

      // Create invoice record
      const invoiceRecord = {
        invoice_number: invoiceNumber,
        booking_id: bookingId,
        user_id: userId,
        vendor_id: vendorId,
        vendor_account_id: vendorAccountId,
        status: 'draft',
        currency: currency.toUpperCase(),
        subtotal: CurrencyService.displayToStripe(subtotal, currency),
        tax_rate: taxRate || CurrencyService.getTaxRate(currency),
        tax_amount: CurrencyService.displayToStripe(taxAmount, currency),
        total: CurrencyService.displayToStripe(total, currency),
        template: template,
        customer_info: customerInfo,
        vendor_info: vendorInfo,
        line_items: items,
        due_date: dueDate,
        notes: notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert(invoiceRecord)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create invoice: ${error.message}`);
      }

      return {
        ...invoice,
        subtotal: CurrencyService.stripeToDisplay(invoice.subtotal, currency),
        tax_amount: CurrencyService.stripeToDisplay(invoice.tax_amount, currency),
        total: CurrencyService.stripeToDisplay(invoice.total, currency),
      };
    } catch (error) {
      throw new Error(`Invoice creation failed: ${error.message}`);
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoice(invoiceId) {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) {
      throw new Error(`Failed to get invoice: ${error.message}`);
    }

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Convert amounts back to display format
    const currency = invoice.currency;
    return {
      ...invoice,
      subtotal: CurrencyService.stripeToDisplay(invoice.subtotal, currency),
      tax_amount: CurrencyService.stripeToDisplay(invoice.tax_amount, currency),
      total: CurrencyService.stripeToDisplay(invoice.total, currency),
    };
  }

  /**
   * Get invoices by user ID
   */
  static async getUserInvoices(userId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;

    let query = supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: invoices, error } = await query;

    if (error) {
      throw new Error(`Failed to get user invoices: ${error.message}`);
    }

    // Convert amounts back to display format
    return invoices.map(invoice => ({
      ...invoice,
      subtotal: CurrencyService.stripeToDisplay(invoice.subtotal, invoice.currency),
      tax_amount: CurrencyService.stripeToDisplay(invoice.tax_amount, invoice.currency),
      total: CurrencyService.stripeToDisplay(invoice.total, invoice.currency),
    }));
  }

  /**
   * Get invoices by vendor ID
   */
  static async getVendorInvoices(vendorId, options = {}) {
    const { status, limit = 50, offset = 0 } = options;

    let query = supabase
      .from('invoices')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: invoices, error } = await query;

    if (error) {
      throw new Error(`Failed to get vendor invoices: ${error.message}`);
    }

    // Convert amounts back to display format
    return invoices.map(invoice => ({
      ...invoice,
      subtotal: CurrencyService.stripeToDisplay(invoice.subtotal, invoice.currency),
      tax_amount: CurrencyService.stripeToDisplay(invoice.tax_amount, invoice.currency),
      total: CurrencyService.stripeToDisplay(invoice.total, invoice.currency),
    }));
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(invoiceId, status, metadata = {}) {
    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Add status-specific fields
    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    } else if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
      if (metadata.paymentIntentId) {
        updateData.stripe_payment_intent_id = metadata.paymentIntentId;
      }
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update invoice status: ${error.message}`);
    }

    return invoice;
  }

  /**
   * Generate PDF invoice
   */
  static async generatePDF(invoiceId, template = 'standard') {
    const invoice = await this.getInvoice(invoiceId);

    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF();

      // Generate PDF based on template
      switch (template) {
        case 'standard':
          await this.generateStandardTemplate(doc, invoice);
          break;
        case 'minimal':
          await this.generateMinimalTemplate(doc, invoice);
          break;
        case 'branded':
          await this.generateBrandedTemplate(doc, invoice);
          break;
        default:
          await this.generateStandardTemplate(doc, invoice);
      }

      // Return PDF as blob
      return doc.output('blob');
    } catch (error) {
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  /**
   * Generate standard invoice template
   */
  static async generateStandardTemplate(doc, invoice) {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Company Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(COMPANY_INFO.name, 20, yPosition);
    yPosition += 6;
    doc.text(COMPANY_INFO.address.line1, 20, yPosition);
    if (COMPANY_INFO.address.line2) {
      yPosition += 6;
      doc.text(COMPANY_INFO.address.line2, 20, yPosition);
    }
    yPosition += 6;
    doc.text(`${COMPANY_INFO.address.city}, ${COMPANY_INFO.address.state} ${COMPANY_INFO.address.postal}`, 20, yPosition);
    yPosition += 6;
    doc.text(COMPANY_INFO.address.country, 20, yPosition);
    yPosition += 10;

    // Invoice Details (right side)
    const rightX = pageWidth - 20;
    let rightY = 40;
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Number:', rightX - 60, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoice_number, rightX, rightY, { align: 'right' });
    rightY += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', rightX - 60, rightY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(invoice.created_at).toLocaleDateString(), rightX, rightY, { align: 'right' });
    rightY += 8;

    if (invoice.due_date) {
      doc.setFont('helvetica', 'bold');
      doc.text('Due Date:', rightX - 60, rightY);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(invoice.due_date).toLocaleDateString(), rightX, rightY, { align: 'right' });
      rightY += 8;
    }

    yPosition = Math.max(yPosition, rightY) + 10;

    // Bill To Section
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, yPosition);
    yPosition += 8;

    doc.setFont('helvetica', 'normal');
    if (invoice.customer_info) {
      const customer = invoice.customer_info;
      if (customer.name) {
        doc.text(customer.name, 20, yPosition);
        yPosition += 6;
      }
      if (customer.email) {
        doc.text(customer.email, 20, yPosition);
        yPosition += 6;
      }
      if (customer.address) {
        doc.text(customer.address, 20, yPosition);
        yPosition += 6;
      }
    }

    yPosition += 15;

    // Line Items Header
    const lineItemsStartY = yPosition;
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, yPosition);
    doc.text('Quantity', pageWidth - 120, yPosition, { align: 'right' });
    doc.text('Rate', pageWidth - 80, yPosition, { align: 'right' });
    doc.text('Amount', pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 8;

    // Line under header
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    // Line Items
    doc.setFont('helvetica', 'normal');
    if (invoice.line_items && invoice.line_items.length > 0) {
      invoice.line_items.forEach(item => {
        doc.text(item.description || 'Service', 20, yPosition);
        doc.text(item.quantity?.toString() || '1', pageWidth - 120, yPosition, { align: 'right' });
        doc.text(CurrencyService.formatAmount(item.rate || 0, invoice.currency), pageWidth - 80, yPosition, { align: 'right' });
        doc.text(CurrencyService.formatAmount(item.amount || 0, invoice.currency), pageWidth - 20, yPosition, { align: 'right' });
        yPosition += 8;
      });
    } else {
      // Default line item for booking
      doc.text('Adventure Booking Service', 20, yPosition);
      doc.text('1', pageWidth - 120, yPosition, { align: 'right' });
      doc.text(CurrencyService.formatAmount(invoice.subtotal, invoice.currency), pageWidth - 80, yPosition, { align: 'right' });
      doc.text(CurrencyService.formatAmount(invoice.subtotal, invoice.currency), pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 8;
    }

    yPosition += 10;

    // Totals
    const totalsX = pageWidth - 80;
    doc.line(totalsX - 20, yPosition, pageWidth - 20, yPosition);
    yPosition += 8;

    doc.text('Subtotal:', totalsX - 20, yPosition);
    doc.text(CurrencyService.formatAmount(invoice.subtotal, invoice.currency), pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 8;

    if (invoice.tax_amount > 0) {
      doc.text(`Tax (${(invoice.tax_rate * 100).toFixed(1)}%):`, totalsX - 20, yPosition);
      doc.text(CurrencyService.formatAmount(invoice.tax_amount, invoice.currency), pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 8;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Total:', totalsX - 20, yPosition);
    doc.text(CurrencyService.formatAmount(invoice.total, invoice.currency), pageWidth - 20, yPosition, { align: 'right' });

    // Footer
    if (invoice.notes) {
      yPosition += 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Notes:', 20, yPosition);
      yPosition += 6;
      const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40);
      doc.text(splitNotes, 20, yPosition);
    }

    // Footer with contact info
    const footerY = pageHeight - 30;
    doc.setFontSize(8);
    doc.text(COMPANY_INFO.contact.email, pageWidth / 2, footerY, { align: 'center' });
    doc.text(COMPANY_INFO.contact.phone, pageWidth / 2, footerY + 4, { align: 'center' });
    doc.text(COMPANY_INFO.contact.website, pageWidth / 2, footerY + 8, { align: 'center' });
  }

  /**
   * Generate minimal invoice template
   */
  static async generateMinimalTemplate(doc, invoice) {
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 30;

    // Simple header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice', 20, yPosition);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoice_number, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 20;

    // Minimal details
    doc.text(`Amount: ${CurrencyService.formatAmount(invoice.total, invoice.currency)}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 20, yPosition);
    yPosition += 8;

    if (invoice.customer_info?.email) {
      doc.text(`Customer: ${invoice.customer_info.email}`, 20, yPosition);
    }
  }

  /**
   * Generate branded invoice template
   */
  static async generateBrandedTemplate(doc, invoice) {
    // Enhanced template with branding elements
    await this.generateStandardTemplate(doc, invoice);

    // Add brand colors, logos, etc. here
    // This would require additional styling and branding elements
  }

  /**
   * Send invoice via email using the email service
   */
  static async sendInvoiceEmail(invoiceId, recipientEmail, options = {}) {
    const { attachPDF = true, template = 'standard', customerName } = options;

    try {
      const invoice = await this.getInvoice(invoiceId);

      if (!invoice) {
        throw new Error(`Invoice ${invoiceId} not found`);
      }

      let attachments = [];

      // Generate PDF attachment if requested
      if (attachPDF) {
        try {
          const pdfBlob = await this.generatePDF(invoiceId, template);
          const pdfBuffer = await pdfBlob.arrayBuffer();

          attachments.push({
            filename: `invoice-${invoice.invoice_number || invoiceId}.pdf`,
            content: Buffer.from(pdfBuffer),
            type: 'application/pdf'
          });
        } catch (pdfError) {
          console.warn('PDF generation failed, sending email without attachment:', pdfError);
        }
      }

      // Prepare email data
      const emailData = {
        invoiceNumber: invoice.invoice_number || invoiceId,
        customerName: customerName || invoice.customer_info?.name || 'Valued Customer',
        amount: invoice.total_amount,
        currency: invoice.currency || 'USD',
        dueDate: invoice.due_date,
        companyName: COMPANY_INFO.name,
        supportEmail: COMPANY_INFO.contact.email
      };

      // Send email using the email service
      const result = await emailService.sendTemplatedEmail(
        'invoiceDelivery',
        recipientEmail,
        emailData,
        {
          attachments: attachments.length > 0 ? attachments : undefined,
          replyTo: COMPANY_INFO.contact.email,
          entityId: `invoice-${invoiceId}`
        }
      );

      // Update invoice status
      await this.updateInvoiceStatus(invoiceId, 'sent');

      // Log successful delivery
      console.log(`Invoice ${invoice.invoice_number} sent to ${recipientEmail}`, {
        messageId: result.messageId,
        attachments: attachments.length
      });

      return {
        success: true,
        messageId: result.messageId,
        invoiceId,
        recipientEmail,
        attachmentIncluded: attachments.length > 0
      };

    } catch (error) {
      console.error('Invoice email sending failed:', error);
      throw new Error(`Invoice email delivery failed: ${error.message}`);
    }
  }

  /**
   * Mark invoice as paid
   */
  static async markAsPaid(invoiceId, paymentIntentId = null) {
    return await this.updateInvoiceStatus(invoiceId, 'paid', { paymentIntentId });
  }

  /**
   * Cancel invoice
   */
  static async cancelInvoice(invoiceId, reason = '') {
    const updateData = {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (reason) {
      updateData.cancellation_reason = reason;
    }

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel invoice: ${error.message}`);
    }

    return invoice;
  }

  /**
   * Get invoice statistics
   */
  static async getInvoiceStats(userId = null, vendorId = null) {
    let query = supabase
      .from('invoices')
      .select('status, total, currency, created_at');

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    const { data: invoices, error } = await query;

    if (error) {
      throw new Error(`Failed to get invoice statistics: ${error.message}`);
    }

    // Calculate statistics
    const stats = {
      total: invoices.length,
      draft: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      currencies: {},
    };

    const now = new Date();

    invoices.forEach(invoice => {
      stats[invoice.status]++;

      const amount = CurrencyService.stripeToDisplay(invoice.total, invoice.currency);
      stats.totalAmount += amount;

      if (invoice.status === 'paid') {
        stats.paidAmount += amount;
      } else if (invoice.status === 'sent') {
        stats.pendingAmount += amount;
      }

      // Track by currency
      if (!stats.currencies[invoice.currency]) {
        stats.currencies[invoice.currency] = {
          total: 0,
          paid: 0,
          pending: 0,
        };
      }

      stats.currencies[invoice.currency].total += amount;
      if (invoice.status === 'paid') {
        stats.currencies[invoice.currency].paid += amount;
      } else if (invoice.status === 'sent') {
        stats.currencies[invoice.currency].pending += amount;
      }
    });

    return stats;
  }
}

// Export default service instance
export default InvoiceService;