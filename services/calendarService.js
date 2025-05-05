const erpnextService = require('./erpnextService');

class CalendarService {
    async getEvents(start, end) {
        try {
            // Récupérer les factures
            const invoices = await this.getInvoiceEvents(start, end);
            // Récupérer les devis fournisseurs
            const quotations = await this.getQuotationEvents(start, end);

            return [...invoices, ...quotations];
        } catch (error) {
            console.error('Error getting calendar events:', error);
            throw error;
        }
    }

    async getInvoiceEvents(start, end) {
        try {
            const result = await erpnextService.getList('Purchase Invoice', {
                fields: [
                    'name',
                    'supplier',
                    'posting_date',
                    'due_date',
                    'grand_total',
                    'status',
                    'outstanding_amount'
                ],
                filters: [
                    ['Purchase Invoice', 'docstatus', '=', 1],
                    ['Purchase Invoice', 'posting_date', '>=', start],
                    ['Purchase Invoice', 'due_date', '<=', end]
                ],
                order_by: 'posting_date desc'
            });

            if (!result.success) return [];

            // Transformer les factures en événements
            return result.data.map(invoice => {
                const isPaid = invoice.outstanding_amount === 0;
                const isDue = new Date(invoice.due_date) < new Date() && !isPaid;

                return {
                    id: `invoice-${invoice.name}`,
                    title: `Facture ${invoice.name} - ${invoice.supplier}`,
                    start: invoice.posting_date,
                    end: invoice.due_date,
                    color: isPaid ? '#28a745' : isDue ? '#dc3545' : '#ffc107',
                    extendedProps: {
                        type: 'invoice',
                        status: invoice.status,
                        amount: invoice.grand_total,
                        supplier: invoice.supplier
                    }
                };
            });
        } catch (error) {
            console.error('Error getting invoice events:', error);
            return [];
        }
    }

    async getQuotationEvents(start, end) {
        try {
            const result = await erpnextService.getList('Supplier Quotation', {
                fields: [
                    'name',
                    'supplier',
                    'supplier_name',
                    'transaction_date',
                    'valid_till',
                    'grand_total',
                    'status'
                ],
                filters: [
                    ['Supplier Quotation', 'docstatus', '<', 2],
                    ['Supplier Quotation', 'transaction_date', '>=', start],
                    ['Supplier Quotation', 'valid_till', '<=', end]
                ],
                order_by: 'transaction_date desc'
            });

            if (!result.success) return [];

            // Transformer les devis en événements
            return result.data.map(quotation => {
                const isExpired = new Date(quotation.valid_till) < new Date();

                return {
                    id: `quotation-${quotation.name}`,
                    title: `Devis ${quotation.name} - ${quotation.supplier_name || quotation.supplier}`,
                    start: quotation.transaction_date,
                    end: quotation.valid_till,
                    color: isExpired ? '#6c757d' : '#17a2b8',
                    extendedProps: {
                        type: 'quotation',
                        status: quotation.status,
                        amount: quotation.grand_total,
                        supplier: quotation.supplier_name || quotation.supplier
                    }
                };
            });
        } catch (error) {
            console.error('Error getting quotation events:', error);
            return [];
        }
    }
}

module.exports = new CalendarService();
