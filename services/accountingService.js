const erpnextService = require('./erpnextService');

class AccountingService {
    async getAllInvoices(status = '') {
        try {
            const filters = [['Purchase Invoice', 'docstatus', '=', 1]];
            
            if (status) {
                filters.push(['Purchase Invoice', 'status', '=', status]);
            }

            const result = await erpnextService.getList('Purchase Invoice', {
                fields: [
                    'name',
                    'supplier',
                    'posting_date',
                    'due_date',
                    'grand_total',
                    'status',
                    'docstatus',
                    'outstanding_amount',
                    'paid_amount'
                ],
                filters: filters,
                order_by: 'posting_date desc'
            });
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error getting invoices:', error);
            throw error;
        }
    }

    async getInvoiceDetails(invoiceId) {
        try {
            const result = await erpnextService.getDoc('Purchase Invoice', invoiceId);
            return result.success ? result.data : null;
        } catch (error) {
            console.error('Error getting invoice details:', error);
            throw error;
        }
    }

    async makePayment(invoiceId, amount, paymentDate, paymentMode) {
        try {
            // D'abord, récupérer les détails de la facture pour avoir la société et le fournisseur
            const invoice = await this.getInvoiceDetails(invoiceId);
            if (!invoice) {
                throw new Error('Facture non trouvée');
            }

            // Récupérer les comptes par défaut de la société
            const companyAccounts = await erpnextService.getDoc('Company', invoice.company);
            if (!companyAccounts.success) {
                throw new Error('Impossible de récupérer les informations de la société');
            }

            // Créer un paiement pour la facture
            const paymentEntry = {
                doctype: 'Payment Entry',
                payment_type: 'Pay',
                posting_date: paymentDate,
                company: invoice.company,
                paid_from: companyAccounts.data.default_bank_account,
                paid_to: companyAccounts.data.default_payable_account,
                paid_amount: amount,
                received_amount: amount,
                reference_no: `PAY-${Date.now()}`,
                reference_date: paymentDate,
                party_type: 'Supplier',
                party: invoice.supplier,
                mode_of_payment: paymentMode,
                references: [{
                    reference_doctype: 'Purchase Invoice',
                    reference_name: invoiceId,
                    allocated_amount: amount
                }]
            };

            // Créer le paiement
            const result = await erpnextService.createDoc('Payment Entry', paymentEntry);
            if (!result.success) {
                throw new Error('Erreur lors de la création du paiement');
            }

            // Soumettre le paiement
            const submitResult = await erpnextService.updateDoc('Payment Entry', result.data.name, {
                docstatus: 1
            });

            return submitResult.success;
        } catch (error) {
            console.error('Error making payment:', error);
            throw error;
        }
    }

    async getPaymentModes() {
        try {
            const result = await erpnextService.getList('Mode of Payment', {
                fields: ['name', 'type'],
                filters: [['Mode of Payment', 'enabled', '=', 1]]
            });
            return result.success ? result.data : [];
        } catch (error) {
            console.error('Error getting payment modes:', error);
            throw error;
        }
    }

    async getInvoicePrintFormat(invoiceId, format = 'Standard') {
        try {
            const result = await erpnextService.getPrintFormat('Purchase Invoice', invoiceId, format);
            return result;
        } catch (error) {
            console.error('Error getting invoice print format:', error);
            throw error;
        }
    }
}

module.exports = new AccountingService();
